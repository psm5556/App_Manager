@echo off
:: App Manager 종료 스크립트 (Windows)
:: 포트 7000 (백엔드), 5173 (프론트엔드 dev) 에서 실행 중인 프로세스를 종료합니다.

echo [App Manager] Stopping servers...
set KILLED=0

for %%P in (7000 5173) do (
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo   Killing PID %%a ^(port %%P^)
        taskkill /PID %%a /F >nul 2>&1
        set KILLED=1
    )
)

if "%KILLED%"=="0" (
    echo   No processes found on ports 7000 / 5173.
) else (
    echo Done.
)
pause
