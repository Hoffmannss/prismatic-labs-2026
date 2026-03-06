@echo off
cd /d C:\Users\hoffm\projetos\prismatic-labs-2026
git pull origin main
echo.
echo Abrindo dashboard em http://localhost:3131 ...
start http://localhost:3131
cd vendedor
node 8-dashboard.js
pause
