@echo off
setlocal

set BACKEND_DIR=%~dp0..\backend
set FRONTEND_DIR=%~dp0..\frontend

cd /d "%BACKEND_DIR%"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting backend on port 7000...
start "AppManager-Backend" cmd /k "cd /d %BACKEND_DIR% && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 7000 --reload"

cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend dev server on port 5173...
start "AppManager-Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Backend  : http://localhost:7000
echo Frontend : http://localhost:5173  (connect here during dev)
echo.
echo Servers are running in separate windows.
pause
