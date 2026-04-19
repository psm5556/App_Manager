@echo off
setlocal

for %%i in ("%~dp0..") do set ROOT=%%~fi
set BACKEND_DIR=%ROOT%\backend

rem ===== conda env name (change if needed) =====
set CONDA_ENV=SPDM
rem ==============================================

echo BACKEND: %BACKEND_DIR%

rem Find conda activate.bat
set CONDA_ACTIVATE=
if exist "%USERPROFILE%\anaconda3\Scripts\activate.bat"   set CONDA_ACTIVATE=%USERPROFILE%\anaconda3\Scripts\activate.bat
if exist "%USERPROFILE%\miniconda3\Scripts\activate.bat"  set CONDA_ACTIVATE=%USERPROFILE%\miniconda3\Scripts\activate.bat
if exist "%LOCALAPPDATA%\anaconda3\Scripts\activate.bat"  set CONDA_ACTIVATE=%LOCALAPPDATA%\anaconda3\Scripts\activate.bat
if exist "%LOCALAPPDATA%\miniconda3\Scripts\activate.bat" set CONDA_ACTIVATE=%LOCALAPPDATA%\miniconda3\Scripts\activate.bat
if exist "C:\ProgramData\anaconda3\Scripts\activate.bat"  set CONDA_ACTIVATE=C:\ProgramData\anaconda3\Scripts\activate.bat
if exist "C:\ProgramData\miniconda3\Scripts\activate.bat" set CONDA_ACTIVATE=C:\ProgramData\miniconda3\Scripts\activate.bat

if "%CONDA_ACTIVATE%"=="" (
    echo [ERROR] conda not found.
    pause & exit /b 1
)

echo Activating conda env: %CONDA_ENV%...
call "%CONDA_ACTIVATE%" %CONDA_ENV%
if errorlevel 1 ( echo [ERROR] conda activate failed. & pause & exit /b 1 )

if not exist "%BACKEND_DIR%\static" (
    echo [ERROR] Frontend not built. Run scripts\build.bat first.
    pause & exit /b 1
)

echo Starting App Manager on port 7000...
echo Open: http://localhost:7000
cd /d "%BACKEND_DIR%"
uvicorn main:app --host 0.0.0.0 --port 7000
pause
