"""Pydantic request/response models."""
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.sensors.simulated import SCENARIOS

Severity = Literal["info", "warning", "critical"]
Scenario = Literal[SCENARIOS]
HHMM = r"^([01]\d|2[0-3]):[0-5]\d$"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Patient ---
class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int | None
    notes: str | None
    home_lat: float | None
    home_lng: float | None
    safe_radius_m: float


class PatientUpdate(BaseModel):
    """Partial update: only the fields you send are changed."""
    name: str | None = Field(default=None, min_length=1, max_length=100)
    age: int | None = Field(default=None, ge=0, le=130)
    notes: str | None = None
    home_lat: float | None = Field(default=None, ge=-90, le=90)
    home_lng: float | None = Field(default=None, ge=-180, le=180)
    safe_radius_m: float | None = Field(default=None, gt=0)


# --- Known persons ---
class KnownPersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    relationship: str
    photo_path: str


# --- Events ---
class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    message: str
    severity: Severity
    source: Literal["real", "simulated"]
    created_at: datetime
    snapshot_path: str | None

    @field_serializer("created_at")
    def _as_utc(self, value: datetime) -> str:
        # SQLite drops tzinfo; values are stored in UTC, so label them as UTC
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()


# --- Reminders ---
class ReminderCreate(BaseModel):
    text: str = Field(min_length=1, max_length=255)
    time_of_day: str = Field(pattern=HHMM, examples=["08:30"])
    active: bool = True


class ReminderUpdate(BaseModel):
    """Partial update: only the fields you send are changed."""
    text: str | None = Field(default=None, min_length=1, max_length=255)
    time_of_day: str | None = Field(default=None, pattern=HHMM, examples=["08:30"])
    active: bool | None = None


class ReminderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    time_of_day: str
    active: bool


# --- Live recognition ---
class RecognizedFace(BaseModel):
    name: str | None
    relationship: str | None
    status: Literal["known", "unknown"]
    distance: float | None  # closest known face; None if nobody is enrolled


class RecognitionResult(BaseModel):
    faces: list[RecognizedFace]
    speak: str | None  # set only on the frame where someone is announced
    state: Literal["no_face", "tracking", "announced"]


# --- Sensors ---
class SensorReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ts: float
    ax: float
    ay: float
    az: float
    lat: float
    lng: float
    heart_rate: int
    spo2: int
    battery: float


class ScenarioIn(BaseModel):
    scenario: Scenario


class SimState(BaseModel):
    scenario: Scenario
    scenarios: list[str]
    reading: SensorReadingOut | None


class PatientStatus(BaseModel):
    scenario: str | None  # None when real hardware is connected
    simulated: bool
    reading: SensorReadingOut | None
    in_safe_zone: bool | None
    distance_from_home_m: float | None
    safe_radius_m: float | None
    last_known_person: EventOut | None  # latest face_known event
    unread_alerts: int  # warning/critical alerts after `since`
    latest_alert: EventOut | None


# --- Alerts ---
class AlertResult(BaseModel):
    event: EventOut
    sms_event: EventOut
    telegram: str  # "sent", "skipped" or "failed: <reason>"
