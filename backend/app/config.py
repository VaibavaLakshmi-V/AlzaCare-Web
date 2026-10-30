"""Application settings loaded from environment variables (.env)."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    APP_NAME: str = "AlzaCare Web"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'alzacare.db').as_posix()}"
    FACES_DIR: Path = BASE_DIR / "faces"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"

    # Live face recognition
    RECOGNITION_FRAME_WIDTH: int = 320  # frames are downscaled to this width before detection
    RECOGNITION_TOLERANCE: float = 0.45  # max face distance counted as a match (lower = stricter)
    STABLE_FRAMES: int = 3  # consecutive matches needed before announcing someone
    COOLDOWN_SECONDS: int = 60  # don't re-announce the same person (or "unknown") within this window
    ABSENCE_RESET_SECONDS: int = 10  # no face for this long resets tracking

    # Sensor loop
    SENSOR_HZ: int = 10  # readings per second
    SENSOR_BROADCAST_SECONDS: float = 1.0  # WebSocket "sensor" message interval
    SIM_WANDER_SPEED_MPS: float = 4.0  # faster than walking so the demo leaves a 200 m zone in about a minute

    # Fall detection
    FALL_IMPACT_G: float = 2.5  # acceleration magnitude counted as an impact
    FALL_STILL_SECONDS: float = 2.0  # stillness needed after the impact
    FALL_STILL_TOLERANCE_G: float = 0.15  # "still" = magnitude within this of 1 g
    FALL_SETTLE_SECONDS: float = 2.0  # stillness must begin within this long after the impact
    FALL_COOLDOWN_SECONDS: int = 30

    # Geofence
    GEOFENCE_REALERT_SECONDS: int = 120  # repeat the alert while the patient stays outside
    GEOFENCE_HYSTERESIS_M: float = 10.0  # must come this far back inside to count as returned (GPS jitter)

    # Vitals
    HEART_RATE_HIGH: int = 120
    HEART_RATE_LOW: int = 45
    SPO2_LOW: int = 92
    BATTERY_LOW: int = 15
    VITALS_SUSTAIN_SECONDS: float = 2.0  # a reading must stay out of range this long (ignores single glitches)
    VITALS_COOLDOWN_SECONDS: int = 120


settings = Settings()
