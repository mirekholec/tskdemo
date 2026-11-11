#!/usr/bin/env bash
# Spustí aplikaci Kavárna Holubník a otevře ji v prohlížeči.
# Server běží v popředí, ukončíte ho klávesami Ctrl+C.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Chyba: Node.js není nainstalovaný (potřeba verze 22.13 nebo novější)." >&2
  exit 1
fi

# node:sqlite funguje bez přepínače až od Node.js 22.13
if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)'; then
  echo "Chyba: je potřeba Node.js 22.13 nebo novější, nainstalovaný je $(node --version)." >&2
  exit 1
fi

# Adresu bereme z konfigurace, aby byl port nastavený jen na jednom místě
read -r HOST PORT < <(node --input-type=module -e "import config from './src/config.js'; console.log(config.server.host, config.server.port)")
URL="http://${HOST}:${PORT}"

is_running() {
  curl -s -o /dev/null --max-time 1 "${URL}/"
}

open_browser() {
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1
  else
    echo "Otevřete v prohlížeči: $URL"
  fi
}

if is_running; then
  echo "Aplikace už běží na $URL"
  open_browser
  exit 0
fi

node src/server.js &
SERVER_PID=$!

# Při ukončení skriptu (i přes Ctrl+C) zastavíme i server
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
trap 'exit 130' INT TERM

# Počkáme, až server začne odpovídat (max. 10 s)
for _ in $(seq 1 100); do
  if is_running; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Chyba: server se nepodařilo spustit." >&2
    exit 1
  fi
  sleep 0.1
done

if ! is_running; then
  echo "Chyba: server neodpovídá na $URL." >&2
  exit 1
fi

open_browser
wait "$SERVER_PID"
