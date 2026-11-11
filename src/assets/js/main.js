// Navigace webu: mobilní menu, stín headeru po odscrollování a zvýraznění aktivní sekce.

const header = document.getElementById('site-header');
const toggle = document.getElementById('nav-toggle');
const nav = document.getElementById('site-nav');
const navLinks = [...document.querySelectorAll('[data-nav-link]')];

function setMenuOpen(isOpen) {
  toggle.setAttribute('aria-expanded', String(isOpen));
  nav.classList.toggle('is-open', isOpen);
}

function initMobileMenu() {
  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  for (const link of navLinks) {
    link.addEventListener('click', () => setMenuOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // Po přechodu na desktopovou šířku menu zavřeme, aby nezůstal otevřený stav
  window.matchMedia('(min-width: 768px)').addEventListener('change', () => setMenuOpen(false));
}

function initHeaderShadow() {
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// Zvýrazní odkaz na stránku, na které právě jsme (např. „Rezervovat“ na /rezervace)
function markCurrentPage() {
  for (const link of navLinks) {
    const url = new URL(link.href);
    if (!url.hash && url.pathname === window.location.pathname) {
      link.setAttribute('aria-current', 'page');
    }
  }
}

// Na one-page zvýrazní odkaz sekce, která je právě uprostřed obrazovky
function initActiveSection() {
  const sectionLinks = new Map();

  for (const link of navLinks) {
    const url = new URL(link.href);
    const section = url.hash && url.pathname === window.location.pathname
      ? document.getElementById(url.hash.slice(1))
      : null;
    if (section) {
      sectionLinks.set(section, link);
    }
  }

  if (sectionLinks.size === 0 || !('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = sectionLinks.get(entry.target);
        if (entry.isIntersecting) {
          navLinks.forEach((item) => item.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current') === 'true') {
          link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  for (const section of sectionLinks.keys()) {
    observer.observe(section);
  }
}

initMobileMenu();
initHeaderShadow();
markCurrentPage();
initActiveSection();
