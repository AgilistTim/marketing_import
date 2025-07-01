#!/usr/bin/env bash

# Simple dev script for local development
# 1. Kills any process using backend (8000) or frontend (5173) ports
# 2. Ensures Python virtual-environment is activated and dependencies installed
# 3. Starts Flask backend on port 8000 (background)
# 4. Starts Vite React frontend on port 5173 (foreground)

# Workspace root (directory of this script)
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR" || exit 1

BACKEND_PORT=8000
FRONTEND_PORT=5173

# Kill existing processes on the ports
if command -v lsof >/dev/null 2>&1; then
  lsof -ti :$BACKEND_PORT | xargs -r kill -9
  lsof -ti :$FRONTEND_PORT | xargs -r kill -9
fi

# Kill any stray dev servers
pkill -f "python .*main.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Activate virtual environment
if [[ -d "venv" ]]; then
  # shellcheck disable=SC1091
  source "venv/bin/activate"
else
  python -m venv venv
  # shellcheck disable=SC1091
  source "venv/bin/activate"
fi

# Install Python dependencies (quiet unless changes)
pip install -q -r requirements.txt

# Start backend (Flask) in background
PORT=$BACKEND_PORT FLASK_ENV=development python main.py &
BACKEND_PID=$!

echo "Backend started (PID $BACKEND_PID) on http://localhost:$BACKEND_PORT"

echo "Starting Vite frontend on http://localhost:$FRONTEND_PORT ..."
# Start frontend (foreground) – press Ctrl-C to stop both
npm run dev -- --port $FRONTEND_PORT --host localhost --strictPort

# When frontend exits, stop backend
kill $BACKEND_PID 2>/dev/null || true 