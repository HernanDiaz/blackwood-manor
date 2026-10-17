@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
 echo Instala Node.js 22 o posterior para jugar.
 pause
 exit /b 1
)
echo Abre http://localhost:4173 en tu navegador. Ctrl+C para detener.
node server.mjs
pause
