@echo off
for %%i in ("%~dp0..") do set ROOT=%%~fi
set FRONTEND_DIR=%ROOT%\frontend
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [Frontend] Installing dependencies...
    npm install
    if errorlevel 1 ( echo [ERROR] npm not found. & pause & exit /b 1 )
)
echo [Frontend] Starting on port 5173...
npm run dev
pause
