#!/usr/bin/env bash
# Production start: runs the FastAPI backend (which serves the built frontend)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

if [ ! -d "static" ]; then
  echo "ERROR: Frontend not built. Run scripts/build.sh first."
  exit 1
fi

echo "Starting App Manager on port 7000..."
uvicorn main:app --host 0.0.0.0 --port 7000
