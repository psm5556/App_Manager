@echo off
setlocal

for %%i in ("%~dp0..") do set ROOT=%%~fi
set FRONTEND_DIR=%ROOT%\frontend

echo FRONTEND: %FRONTEND_DIR%

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
