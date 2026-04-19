@echo off
for %%i in ("%~dp0..") do set ROOT=%%~fi
set BACKEND_DIR=%ROOT%\backend

rem ===== conda env name (change if needed) =====
set CONDA_ENV=base
rem ==============================================

cd /d "%BACKEND_DIR%"

echo [Backend] Activating conda env: %CONDA_ENV%...
call conda activate %CONDA_ENV%
if errorlevel 1 ( echo [ERROR] conda activate failed. Is conda in PATH? & pause & exit /b 1 )

pip install -r requirements.txt -q

echo [Backend] Starting on port 7000...
uvicorn main:app --host 0.0.0.0 --port 7000 --reload
pause
