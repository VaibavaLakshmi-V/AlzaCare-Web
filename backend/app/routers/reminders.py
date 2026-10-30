"""Daily reminders for the patient (medication, meals, ...)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Reminder
from app.schemas import ReminderCreate, ReminderOut, ReminderUpdate

router = APIRouter(prefix="/reminders", tags=["reminders"], dependencies=[Depends(get_current_user)])


def _get_reminder(reminder_id: int, db: Session) -> Reminder:
    reminder = db.get(Reminder, reminder_id)
    if reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.get("", response_model=list[ReminderOut])
def list_reminders(db: Session = Depends(get_db)):
    return db.scalars(select(Reminder).order_by(Reminder.time_of_day)).all()


@router.post("", response_model=ReminderOut, status_code=201)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    reminder = Reminder(**data.model_dump())
    db.add(reminder)
    db.commit()
    return reminder


@router.get("/{reminder_id}", response_model=ReminderOut)
def get_reminder(reminder_id: int, db: Session = Depends(get_db)):
    return _get_reminder(reminder_id, db)


@router.put("/{reminder_id}", response_model=ReminderOut)
def update_reminder(reminder_id: int, data: ReminderUpdate, db: Session = Depends(get_db)):
    reminder = _get_reminder(reminder_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    db.commit()
    return reminder


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    db.delete(_get_reminder(reminder_id, db))
    db.commit()
