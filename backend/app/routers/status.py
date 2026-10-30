"""One-call patient overview for the dashboard."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Event
from app.schemas import PatientStatus
from app.services.sensor_monitor import monitor

router = APIRouter(prefix="/status", tags=["status"], dependencies=[Depends(get_current_user)])

# Alerts = warning/critical events, excluding the SMS log entries that echo them
ALERT_FILTER = (Event.severity.in_(("warning", "critical")), Event.type != "sms")


@router.get("", response_model=PatientStatus)
def get_status(
    since: datetime | None = Query(
        default=None, description="Count alerts after this time (ISO 8601), e.g. when the caregiver last looked. "
                                  "Default: last 24 hours."
    ),
    db: Session = Depends(get_db),
):
    if since is None:
        since = datetime.now(timezone.utc) - timedelta(hours=24)
    elif since.tzinfo is not None:
        since = since.astimezone(timezone.utc)
    since = since.replace(tzinfo=None)  # stored timestamps are naive UTC

    newest = (Event.created_at.desc(), Event.id.desc())
    geo = monitor.engine.geofence
    return PatientStatus(
        scenario=monitor.scenario,
        simulated=monitor.source.simulated,
        reading=monitor.latest,
        in_safe_zone=geo.inside,
        distance_from_home_m=round(geo.distance_m, 1) if geo.distance_m is not None else None,
        safe_radius_m=geo.home[2] if geo.home else None,
        last_known_person=db.scalar(select(Event).where(Event.type == "face_known").order_by(*newest)),
        unread_alerts=db.scalar(select(func.count()).where(*ALERT_FILTER, Event.created_at > since)),
        latest_alert=db.scalar(select(Event).where(*ALERT_FILTER).order_by(*newest)),
    )
