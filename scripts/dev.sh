#!/usr/bin/env bash
# App Manager 개발 모드 실행 스크립트 (Linux / macOS, conda)

# ===== conda env name (change if needed) =====
CONDA_ENV=SPDM
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

# conda 초기화
CONDA_SH=""
for CANDIDATE in \
    "$HOME/anaconda3/etc/profile.d/conda.sh" \
    "$HOME/miniconda3/etc/profile.d/conda.sh" \
    "/opt/anaconda3/etc/profile.d/conda.sh" \
    "/opt/miniconda3/etc/profile.d/conda.sh" \
    "/usr/local/anaconda3/etc/profile.d/conda.sh"
do
    if [ -f "$CANDIDATE" ]; then
        CONDA_SH="$CANDIDATE"
        break
    fi
done

if [ -z "$CONDA_SH" ]; then
    echo "[ERROR] conda not found."
    exit 1
fi

source "$CONDA_SH"
conda activate "$CONDA_ENV"
if [ $? -ne 0 ]; then
    echo "[ERROR] conda activate $CONDA_ENV failed."
    exit 1
fi

echo "Starting backend on port 7000..."
cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port 7000 --reload &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting frontend dev server on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend  : http://localhost:7000"
echo "Frontend : http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
