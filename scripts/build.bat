@echo off
REM 프론트엔드 빌드 -> backend/static 출력

set SCRIPT_DIR=%~dp0
set FRONTEND_DIR=%SCRIPT_DIR%..\frontend

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
