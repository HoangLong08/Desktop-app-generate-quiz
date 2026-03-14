"""
Web Quiz Backend - Flask Application Entry Point

Run with:
  python app.py

Or with Flask CLI:
  flask run --port 5000

When USER_DATA_PATH is set (desktop/Electron), runs with host 127.0.0.1 and debug=False.
"""

import os
import logging
from app import create_app

# Configure root logger FIRST
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = create_app()

# Flask sets propagate=False on the "app" logger (same name as our package),
# which swallows all app.features.* log messages. Restore propagation so they
# reach the root handler configured above.
_app_logger = logging.getLogger("app")
_app_logger.propagate = True
# If Flask added a WARNING-level handler, remove it so INFO messages are not filtered
for _h in list(_app_logger.handlers):
    _app_logger.removeHandler(_h)
_app_logger.setLevel(logging.DEBUG)  # let root handler decide the level

if __name__ == "__main__":
    is_desktop = bool(os.getenv("USER_DATA_PATH", "").strip())
    host = "127.0.0.1" if is_desktop else "0.0.0.0"
    debug = not is_desktop
    port = int(os.getenv("PORT", "5000"))
    print("=" * 50)
    print("  Quiz Generator API")
    print(f"  http://{host}:{port}")
    print("  Endpoints:")
    print("    POST /api/quiz/generate    - Generate quiz from files")
    print("    POST /api/quiz/extract-text - Extract text from files")
    print("    GET  /api/quiz/health      - Health check")
    print("    GET  /api/health           - App health check")
    print("=" * 50)
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True,
        use_reloader=False,  # Reloader kills active requests (OCR+LLM takes 60-120s)
    )
