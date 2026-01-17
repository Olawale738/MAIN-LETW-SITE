@echo off
cd /d "%~dp0"
set "PATH=C:\Users\DELL\node_manual\node-v24.13.0-win-x64;%PATH%"
echo Starting Development Server...
call npm run dev
pause
