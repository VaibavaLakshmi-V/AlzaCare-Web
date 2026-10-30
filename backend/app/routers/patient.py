"""The single monitored patient's profile and home geofence."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Patient
from app.schemas import PatientOut, PatientUpdate
from app.services.sensor_monitor import monitor

router = APIRouter(prefix="/patient", tags=["patient"], dependencies=[Depends(get_current_user)])


def _get_patient(db: Session) -> Patient:
    patient = db.scalar(select(Patient).order_by(Patient.id))
    if patient is None:
        raise HTTPException(status_code=404, detail="No patient configured")
    return patient


@router.get("", response_model=PatientOut)
def get_patient(db: Session = Depends(get_db)):
    return _get_patient(db)


@router.put("", response_model=PatientOut)
def update_patient(data: PatientUpdate, db: Session = Depends(get_db)):
    patient = _get_patient(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    monitor.load_patient()  # geofence picks up a new home / radius immediately
    return patient
