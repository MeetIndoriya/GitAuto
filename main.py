import sys
from pathlib import Path

# Ensure backend root directory is in sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.config import settings

if __name__ == "__main__":
    import uvicorn
    print(f"Starting GitAuto API Engine on http://{settings.APP_HOST}:{settings.APP_PORT}...")
    uvicorn.run("app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)

