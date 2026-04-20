@echo off
cd /d "%~dp0"
echo Iniciando CasaIE...
start http://localhost:3000
npm run dev
pause
