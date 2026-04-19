@echo off
REM Windows 프로덕션 실행 (backend/static 빌드 파일 필요)

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..\backend

cd /d "%BACKEND_DIR%"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

if not exist "static" (
    echo ERROR: Frontend not built. Run scripts\build.bat first.
    pause
    exit /b 1
)

echo Starting App Manager on port 7000...
echo http://localhost:7000
uvicorn main:app --host 0.0.0.0 --port 7000
pause
