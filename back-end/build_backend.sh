#!/usr/bin/env bash
#
# Build the Flask backend into a standalone executable using PyInstaller.
# Output is placed in ../front-end/backend/ so electron-builder can bundle it
# as an extraResource.
#
# Prerequisites:
#   - Python 3.11+ installed
#   - pip install -r requirements.txt
#   - pip install pyinstaller

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/front-end/backend"

echo "========================================"
echo "  Building Flask backend (PyInstaller)"
echo "========================================"

# 1. Ensure PyInstaller is installed
echo ""
echo "[1/4] Checking PyInstaller..."
python3 -m pip install pyinstaller --quiet 2>/dev/null || python -m pip install pyinstaller --quiet

# 2. Run PyInstaller in one-dir mode
echo "[2/4] Running PyInstaller..."
cd "$SCRIPT_DIR"

PYTHON_CMD="python3"
command -v python3 &>/dev/null || PYTHON_CMD="python"

$PYTHON_CMD -m PyInstaller \
    --noconfirm \
    --clean \
    --name WebQuizBackend \
    --distpath "$SCRIPT_DIR/dist" \
    --workpath "$SCRIPT_DIR/build" \
    --specpath "$SCRIPT_DIR" \
    --hidden-import "flask" \
    --hidden-import "flask_cors" \
    --hidden-import "flask_sqlalchemy" \
    --hidden-import "sqlalchemy" \
    --hidden-import "dotenv" \
    --hidden-import "pdfplumber" \
    --hidden-import "fitz" \
    --hidden-import "google.generativeai" \
    --hidden-import "google.genai" \
    --hidden-import "youtube_transcript_api" \
    --hidden-import "yt_dlp" \
    --hidden-import "chromadb" \
    --hidden-import "PIL" \
    --hidden-import "numpy" \
    --hidden-import "pdf2image" \
    --collect-all "google.generativeai" \
    --collect-all "google.genai" \
    --collect-all "chromadb" \
    --add-data "app:app" \
    --add-data "config.py:." \
    app.py

# 3. Copy output to front-end/backend/
echo "[3/4] Copying to front-end/backend/ ..."
rm -rf "$FRONTEND_BACKEND_DIR"
cp -R "$SCRIPT_DIR/dist/WebQuizBackend" "$FRONTEND_BACKEND_DIR"

# 4. Verify
if [ -f "$FRONTEND_BACKEND_DIR/WebQuizBackend" ]; then
    SIZE=$(du -sh "$FRONTEND_BACKEND_DIR/WebQuizBackend" | cut -f1)
    echo ""
    echo "[4/4] SUCCESS: $FRONTEND_BACKEND_DIR/WebQuizBackend ($SIZE)"
else
    echo "ERROR: WebQuizBackend executable not found!" >&2
    exit 1
fi

echo ""
echo "Backend build complete!"
