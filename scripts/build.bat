@echo off
setlocal

set FRONTEND_DIR=%~dp0..\frontend

cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Building frontend...
npm run build

echo.
echo Build complete. Output: backend\static\
pause
