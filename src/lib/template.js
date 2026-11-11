// Mini šablonovací engine. Umí jen tři konstrukce:
//   {{> sections/hero }}  vloží fragment src/views/sections/hero.html (i vnořeně)
//   {{ cafe.name }}       vloží hodnotu z kontextu a escapuje HTML
//   {{{ content }}}       vloží hodnotu bez escapování (jen pro HTML vyrobené serverem)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../config.js';

const DEFAULT_VIEWS_DIR = fileURLToPath(new URL('../views/', import.meta.url));
const NAME_PATTERN = /^[a-z0-9/-]+$/;
const MAX_DEPTH = 10;

const INCLUDE_PATTERN = /\{\{>\s*([^}]*?)\s*\}\}/g;
// Trojité závorky musí být v alternaci první, jinak by je pohltila varianta se dvěma
const VARIABLE_PATTERN = /\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g;

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// Vyhledá hodnotu podle tečkové notace. Bere jen vlastní vlastnosti objektu,
// aby šablona nemohla sáhnout např. na {{ constructor }}.
function lookup(context, key) {
  let value = context;
  for (const part of key.split('.')) {
    if (value === null || value === undefined || !Object.hasOwn(Object(value), part)) {
      return '';
    }
    value = value[part];
  }
  return value ?? '';
}

function substituteVariables(source, context) {
  return source.replace(VARIABLE_PATTERN, (match, rawKey, escapedKey) =>
    rawKey ? String(lookup(context, rawKey)) : escapeHtml(lookup(context, escapedKey))
  );
}

export function createTemplateEngine({ viewsDir = DEFAULT_VIEWS_DIR, globals = () => ({}) } = {}) {
  const rootDir = path.resolve(viewsDir) + path.sep;

  async function loadTemplate(name) {
    if (!NAME_PATTERN.test(name)) {
      throw new Error(`Neplatný název šablony: "${name}"`);
    }

    const filePath = path.resolve(rootDir, `${name}.html`);
    if (!filePath.startsWith(rootDir)) {
      throw new Error(`Šablona "${name}" leží mimo složku se šablonami.`);
    }

    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Šablona nenalezena: ${name}.html`);
      }
      throw error;
    }
  }

  // Rekurzivně nahradí {{> fragment }} obsahem souborů. Limit hloubky chrání před cykly.
  async function expandIncludes(source, depth) {
    const matches = [...source.matchAll(INCLUDE_PATTERN)];
    if (matches.length === 0) {
      return source;
    }

    if (depth >= MAX_DEPTH) {
      throw new Error(`Překročena maximální hloubka vnoření šablon (${MAX_DEPTH}), pravděpodobně jde o cyklus.`);
    }

    const fragments = await Promise.all(
      matches.map(async ([, name]) => expandIncludes(await loadTemplate(name), depth + 1))
    );

    let index = 0;
    return source.replace(INCLUDE_PATTERN, () => fragments[index++]);
  }

  async function renderTemplate(name, context) {
    const source = await expandIncludes(await loadTemplate(name), 0);
    return substituteVariables(source, context);
  }

  // Vyrenderuje stránku a volitelně ji vloží do layoutu jako {{{ content }}}.
  async function render(name, data = {}, { layout } = {}) {
    const context = { ...globals(), ...data };
    const content = await renderTemplate(name, context);
    return layout ? renderTemplate(layout, { ...context, content }) : content;
  }

  // Vyrenderuje samostatný fragment, typicky jednu položku seznamu.
  async function renderFragment(name, data = {}) {
    return renderTemplate(name, { ...globals(), ...data });
  }

  return { render, renderFragment };
}

// Globální data dostupná ve všech šablonách. Data handleru je mohou doplnit nebo přepsat.
function appGlobals() {
  return {
    cafe: {
      ...config.cafe,
      // Telefon bez mezer pro odkaz tel:
      phoneHref: config.cafe.phone.replace(/\s+/g, '')
    },
    openingHours: config.openingHours,
    holdMinutes: config.reservations.holdMinutes,
    year: new Date().getFullYear(),
    currentPath: ''
  };
}

export const { render, renderFragment } = createTemplateEngine({ globals: appGlobals });
