@echo off
setlocal

for %%i in ("%~dp0..") do set ROOT=%%~fi
set BACKEND_DIR=%ROOT%\backend
set FRONTEND_DIR=%ROOT%\frontend

echo BACKEND : %BACKEND_DIR%
echo FRONTEND: %FRONTEND_DIR%

if not exist "%BACKEND_DIR%" ( echo [ERROR] Backend folder not found: %BACKEND_DIR% & pause & exit /b 1 )
if not exist "%FRONTEND_DIR%" ( echo [ERROR] Frontend folder not found: %FRONTEND_DIR% & pause & exit /b 1 )

start "AppManager-Backend"  cmd /k "%~dp0_run_backend.bat"
start "AppManager-Frontend" cmd /k "%~dp0_run_frontend.bat"

echo.
echo Backend  : http://localhost:7000
echo Frontend : http://localhost:5173
echo.
echo Two windows opened. Close them to stop the servers.
pause
