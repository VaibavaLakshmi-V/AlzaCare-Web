"""Live face recognition: known-face cache, per-frame matching and speak-once tracking."""
import io
import logging
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime

import face_recognition
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select

from app.config import BASE_DIR, settings
from app.database import SessionLocal
from app.models import KnownPerson

log = logging.getLogger("alzacare.recognition")

UNKNOWN = "unknown"  # tracker key shared by all unrecognized faces


class FrameError(ValueError):
    """Frame can't be processed; the message is safe to show to the user."""


@dataclass
class FaceMatch:
    key: str  # "person:<id>" or UNKNOWN
    name: str | None
    relationship: str | None
    distance: float | None  # distance to the closest known face; None if nobody is enrolled

    @property
    def known(self) -> bool:
        return self.key != UNKNOWN


class FaceCache:
    """In-memory copy of all known encodings. Call reload() after enroll/delete."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._people: list[KnownPerson] = []
        self._encodings = np.empty((0, 128))
        self._loaded = False

    def reload(self) -> None:
        with SessionLocal() as db:
            people = list(db.scalars(select(KnownPerson)).all())
        encodings = np.array([p.face_encoding for p in people], dtype=np.float64).reshape(-1, 128)
        with self._lock:
            self._people, self._encodings, self._loaded = people, encodings, True
        log.info("Face cache loaded: %d known person(s)", len(people))

    def get(self) -> tuple[list[KnownPerson], np.ndarray]:
        if not self._loaded:
            self.reload()
        with self._lock:
            return self._people, self._encodings


class SpeakOnceTracker:
    """Decides when to announce someone. One camera per patient, so state is global.

    A frame with no face does not break a streak (the detector often misses a frame);
    streaks are cleared only after ABSENCE_RESET_SECONDS without any face.
    Announcement times survive resets, so the cooldown holds even if someone leaves and returns.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._streaks: dict[str, int] = {}
        self._last_announced: dict[str, float] = {}
        self._last_face_at: float | None = None

    def update(self, keys: set[str], now: float | None = None) -> list[str]:
        """Feed one frame's identities; returns the keys to announce on this frame."""
        now = time.monotonic() if now is None else now
        with self._lock:
            if self._last_face_at is not None and now - self._last_face_at > settings.ABSENCE_RESET_SECONDS:
                log.info("No face for %ss; tracking reset", settings.ABSENCE_RESET_SECONDS)
                self._streaks.clear()
                self._last_face_at = None
            if not keys:
                return []

            self._last_face_at = now
            # Identities missing from this frame lose their streak
            self._streaks = {key: self._streaks.get(key, 0) + 1 for key in keys}

            announce = []
            for key, streak in self._streaks.items():
                last = self._last_announced.get(key)
                if streak >= settings.STABLE_FRAMES and (last is None or now - last >= settings.COOLDOWN_SECONDS):
                    self._last_announced[key] = now
                    announce.append(key)
            return sorted(announce, key=lambda k: k == UNKNOWN)  # known people first


face_cache = FaceCache()
tracker = SpeakOnceTracker()


def load_frame(data: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(data))
        return ImageOps.exif_transpose(img).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise FrameError("The uploaded frame is not a valid image (send a JPEG).")


def match_faces(img: Image.Image) -> list[FaceMatch]:
    """Detect faces on a downscaled copy and match each against the cache."""
    width = settings.RECOGNITION_FRAME_WIDTH
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.Resampling.BILINEAR)
    pixels = np.array(img)

    locations = face_recognition.face_locations(pixels, model="hog")
    if not locations:
        return []
    encodings = face_recognition.face_encodings(pixels, known_face_locations=locations)

    people, known = face_cache.get()
    matches = []
    for encoding in encodings:
        if not people:
            matches.append(FaceMatch(UNKNOWN, None, None, None))
            continue
        distances = face_recognition.face_distance(known, encoding)
        best = int(np.argmin(distances))
        distance = round(float(distances[best]), 3)
        if distance <= settings.RECOGNITION_TOLERANCE:
            person = people[best]
            matches.append(FaceMatch(f"person:{person.id}", person.name, person.relationship, distance))
        else:
            matches.append(FaceMatch(UNKNOWN, None, None, distance))
    return matches


def announcement_text(match: FaceMatch) -> str:
    if match.known:
        return f"This is your {match.relationship}, {match.name}"
    return "I don't recognize this person"


def save_snapshot(img: Image.Image) -> str:
    """Save a full-size frame to uploads/ and return its path relative to backend/."""
    settings.UPLOADS_DIR.mkdir(exist_ok=True)
    path = settings.UPLOADS_DIR / f"unknown_{datetime.now():%Y%m%d_%H%M%S}_{uuid.uuid4().hex[:8]}.jpg"
    img.save(path, "JPEG", quality=85)
    return path.relative_to(BASE_DIR).as_posix()
