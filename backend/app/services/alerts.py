"""Alert chain: store event -> WebSocket broadcast -> Telegram -> simulated GSM SMS."""
import logging

from app.database import SessionLocal
from app.models import Event
from app.schemas import AlertResult, EventOut
from app.services.telegram import send_telegram
from app.services.ws_manager import manager

log = logging.getLogger("alzacare.alerts")

SEVERITIES = {"info", "warning", "critical"}


async def record_event(
    type: str, message: str, severity: str, source: str = "real", snapshot_path: str | None = None
) -> EventOut:
    """Save an Event and broadcast it to all WebSocket clients."""
    with SessionLocal() as db:
        event = Event(type=type, message=message, severity=severity, source=source, snapshot_path=snapshot_path)
        db.add(event)
        db.commit()
        db.refresh(event)
        out = EventOut.model_validate(event)
    await manager.broadcast({"kind": "event", **out.model_dump(mode="json")})
    return out


async def create_alert(
    type: str, message: str, severity: str, source: str = "real", snapshot_path: str | None = None
) -> AlertResult:
    if severity not in SEVERITIES:
        raise ValueError(f"severity must be one of {sorted(SEVERITIES)}")

    # 1 + 2: store and broadcast the alert itself
    event = await record_event(type, message, severity, source, snapshot_path)
    log.info("Alert #%d [%s] %s: %s", event.id, severity, type, message)

    # 3: Telegram (never raises). Simulated alerts come only from the sensor simulator; say so honestly.
    label = "[SIMULATED SENSOR] " if source == "simulated" else ""
    telegram = await send_telegram(f"{label}AlzaCare alert [{severity.upper()}] {type}\n{message}")

    # 4: simulated GSM SMS, logged as its own event
    sms_event = await record_event("sms", f"SIMULATED GSM SMS SENT: {message}", severity, "simulated")

    return AlertResult(event=event, sms_event=sms_event, telegram=telegram)
