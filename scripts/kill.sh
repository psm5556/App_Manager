#!/usr/bin/env bash
# App Manager 종료 스크립트 (Linux / macOS)
# 포트 7000 (백엔드), 5173 (프론트엔드 dev) 에서 실행 중인 프로세스를 종료합니다.

echo "[App Manager] Stopping servers..."
KILLED=0

for PORT in 7000 5173; do
    PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            echo "  Killing PID $PID (port $PORT)"
            kill -TERM "$PID" 2>/dev/null
        done
        KILLED=1
    fi
done

if [ $KILLED -eq 0 ]; then
    echo "  No processes found on ports 7000 / 5173."
else
    # SIGTERM 후 잔존 프로세스 강제 종료
    sleep 1
    for PORT in 7000 5173; do
        PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                echo "  Force killing PID $PID (port $PORT)"
                kill -KILL "$PID" 2>/dev/null
            done
        fi
    done
    echo "Done."
fi
