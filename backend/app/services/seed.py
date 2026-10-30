"""Creates tables and seeds the default caregiver and demo patient."""
import logging

from sqlalchemy import func, select

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Patient, User

log = logging.getLogger("alzacare.seed")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(User)):
            db.add(User(username="caregiver", password_hash=hash_password("alza123")))
            log.info("Seeded caregiver user 'caregiver'")
        if not db.scalar(select(func.count()).select_from(Patient)):
            db.add(Patient(name="Demo Patient", age=72, home_lat=13.0827, home_lng=80.2707, safe_radius_m=200))
            log.info("Seeded demo patient")
        db.commit()
