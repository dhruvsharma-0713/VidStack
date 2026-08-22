import os
import sys
from pathlib import Path

# Insert root directory into sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Ensure VERCEL environment flag is detected
if "VERCEL" not in os.environ and ("NOW_REGION" in os.environ or "VERCEL_REGION" in os.environ):
    os.environ["VERCEL"] = "1"

try:
    from app import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="VidStack Fallback")

    @app.get("/{full_path:path}")
    async def fallback_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "Startup Import Failed",
                "detail": str(e)
            }
        )
