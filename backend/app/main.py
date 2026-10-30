"""AlzaCare Web backend entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    alerts, auth, events, known_persons, patient, recognition, reminders, sim, status, uploads, ws,
)
from app.services.recognition import face_cache
from app.services.seed import init_db
from app.services.sensor_monitor import monitor

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
log = logging.getLogger("alzacare")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    settings.FACES_DIR.mkdir(exist_ok=True)
    settings.UPLOADS_DIR.mkdir(exist_ok=True)
    face_cache.reload()
    if settings.JWT_SECRET.startswith("change-me"):
        log.warning("JWT_SECRET is a placeholder; set a long random value in backend/.env")
    monitor.start()
    yield
    await monitor.stop()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, status, patient, known_persons, recognition, events, reminders, alerts, sim, uploads, ws):
    app.include_router(module.router)


@app.get("/health")
def health():
    return {"status": "ok"}
