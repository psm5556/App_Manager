@echo off
setlocal

for %%i in ("%~dp0..") do set ROOT=%%~fi
set BACKEND_DIR=%ROOT%\backend

echo BACKEND: %BACKEND_DIR%

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
echo Open: http://localhost:7000
uvicorn main:app --host 0.0.0.0 --port 7000
pause
