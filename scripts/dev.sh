#!/usr/bin/env bash
# Development mode: runs backend + frontend dev server in parallel
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

echo "Starting backend on port 7000..."
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
