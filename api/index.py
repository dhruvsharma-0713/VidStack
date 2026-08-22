import os
import sys
import traceback
from pathlib import Path

# Add root directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from app import app
except Exception as e:
    error_trace = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse

    app = FastAPI()

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        return HTMLResponse(
            content=f"<h2>Application Startup Error</h2><pre>{error_trace}</pre>",
            status_code=500
        )
