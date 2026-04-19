#!/usr/bin/env bash
# App Manager 프로덕션 실행 스크립트 (Linux / macOS, conda)

# ===== conda env name (change if needed) =====
CONDA_ENV=SPDM
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

if [ ! -d "$BACKEND_DIR/static" ]; then
    echo "[ERROR] Frontend not built. Run scripts/build.sh first."
    exit 1
fi

# conda 초기화 (셸에 conda가 없는 경우 대비)
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

echo "Starting App Manager on port 7000..."
echo "Open: http://localhost:7000"
cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port 7000
