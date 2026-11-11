@echo off
rem Spustí aplikaci Kavárna Holubník a otevře ji v prohlížeči (obdoba run.sh pro Windows).
rem Server běží v popředí, ukončíte ho klávesami Ctrl+C.
setlocal EnableExtensions DisableDelayedExpansion

rem Výpisy obsahují diakritiku a soubor je v UTF-8
chcp 65001 >nul

rem Režim na pozadí, ve kterém skript spouští sám sebe (viz níže)
if "%~1"==":open_when_ready" goto open_when_ready

cd /d "%~dp0"

where node >nul 2>nul || (
  echo Chyba: Node.js není nainstalovaný ^(potřeba verze 22.13 nebo novější^). 1>&2
  exit /b 1
)

rem node:sqlite funguje bez přepínače až od Node.js 22.13
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)" || goto node_too_old

rem Adresu bereme z konfigurace, aby byl port nastavený jen na jednom místě
set "APP_URL="
for /f "usebackq tokens=1,2" %%a in (`node --input-type=module -e "import config from './src/config.js'; console.log(config.server.host, config.server.port)"`) do set "APP_URL=http://%%a:%%b"
if not defined APP_URL (
  echo Chyba: nepodařilo se načíst adresu serveru ze src\config.js. 1>&2
  exit /b 1
)

call :is_running 0
if not errorlevel 1 (
  echo Aplikace už běží na %APP_URL%
  start "" "%APP_URL%"
  exit /b 0
)

rem Prohlížeč otevře kopie tohoto skriptu na pozadí, jakmile server začne odpovídat.
rem Server tak může běžet v popředí a Ctrl+C ho ukončí stejně jako v run.sh.
start "" /b cmd /c call "%~f0" :open_when_ready
node src/server.js
exit /b %errorlevel%


:node_too_old
for /f "delims=" %%v in ('node --version') do set "NODE_VERSION=%%v"
echo Chyba: je potřeba Node.js 22.13 nebo novější, nainstalovaný je %NODE_VERSION%. 1>&2
exit /b 1


:open_when_ready
rem Počkáme, až server začne odpovídat (max. 10 s), a otevřeme prohlížeč
call :is_running 10000
if errorlevel 1 (
  echo Chyba: server neodpovídá na %APP_URL%, prohlížeč se neotevře. 1>&2
  exit /b 1
)
start "" "%APP_URL%"
exit /b 0


:is_running
rem Skončí s kódem 0, jakmile server odpoví. Parametr: jak dlouho nejvýš čekat (ms).
node -e "const deadline = Date.now() + Number(process.argv[1]); const check = () => fetch(process.env.APP_URL + '/', { signal: AbortSignal.timeout(1000) }).then(() => process.exit(0), () => (Date.now() < deadline ? setTimeout(check, 100) : process.exit(1))); check();" %1
exit /b %errorlevel%
