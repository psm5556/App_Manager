@echo off
for %%i in ("%~dp0..") do set ROOT=%%~fi
set BACKEND_DIR=%ROOT%\backend
cd /d "%BACKEND_DIR%"
if not exist "venv" (
    echo [Backend] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 ( echo [ERROR] python not found. & pause & exit /b 1 )
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
echo [Backend] Starting on port 7000...
uvicorn main:app --host 0.0.0.0 --port 7000 --reload
pause
