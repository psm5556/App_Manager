@echo off
REM Windows 개발 모드: 백엔드 + 프론트엔드 동시 실행

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..\backend
set FRONTEND_DIR=%SCRIPT_DIR%..\frontend

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
start "AppManager-Backend" cmd /k "cd /d %BACKEND_DIR% && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 7000 --reload"

cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend dev server on port 5173...
start "AppManager-Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Backend  : http://localhost:7000
echo Frontend : http://localhost:5173  (개발용 - 여기로 접속)
echo.
echo 두 개의 터미널 창이 열렸습니다. 창을 닫으면 서버가 종료됩니다.
pause
