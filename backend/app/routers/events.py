"""Event history (alerts, SMS log, detections)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Event
from app.schemas import EventOut

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[EventOut])
def list_events(
    type: str | None = Query(default=None, description="Filter by event type, e.g. fall, sms, test"),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = select(Event).order_by(Event.created_at.desc(), Event.id.desc()).limit(limit)
    if type:
        query = query.where(Event.type == type)
    return db.scalars(query).all()
