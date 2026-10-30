"""Fall, geofence and vitals detection.

Works on SensorReading from any SensorSource and knows nothing about simulation.
All timing uses reading.ts, so the same code runs live at 10 Hz or instantly in tests.
"""
import math
import statistics
from collections.abc import Callable
from dataclasses import dataclass

from app.config import settings
from app.sensors.base import SensorReading

EARTH_RADIUS_M = 6_371_000
STILL_MAX_STDDEV_G = 0.05  # "tiny variation" while lying still


@dataclass
class Detection:
    type: str
    message: str
    severity: str  # info / warning / critical
    alert: bool = True  # False = just log an event (no Telegram / SMS)


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlmb = phi2 - phi1, math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


class FallDetector:
    """Impact above FALL_IMPACT_G, then near-1 g stillness for FALL_STILL_SECONDS."""

    def __init__(self) -> None:
        self._impact_ts: float | None = None
        self._peak_g = 0.0
        self._still_since: float | None = None
        self._still: list[float] = []  # magnitudes since stillness began
        self._cooldown_until = -math.inf

    def update(self, r: SensorReading) -> list[Detection]:
        if r.ts < self._cooldown_until:
            return []
        mag = r.accel_magnitude

        if mag > settings.FALL_IMPACT_G:
            # Every impact (re)starts the stillness check; keep the strongest for the message
            self._peak_g = max(self._peak_g, mag) if self._impact_ts is not None else mag
            self._impact_ts = r.ts
            self._reset_still()
            return []
        if self._impact_ts is None:
            return []

        if abs(mag - 1) <= settings.FALL_STILL_TOLERANCE_G:
            if self._still_since is None:
                self._still_since = r.ts
            self._still.append(mag)
            still_long_enough = r.ts - self._still_since >= settings.FALL_STILL_SECONDS
            if still_long_enough and statistics.pstdev(self._still) <= STILL_MAX_STDDEV_G:
                peak = self._peak_g
                self._clear()
                self._cooldown_until = r.ts + settings.FALL_COOLDOWN_SECONDS
                return [Detection("fall", f"Fall detected: {peak:.1f} g impact followed by no movement", "critical")]
        else:
            self._reset_still()
            if r.ts - self._impact_ts > settings.FALL_SETTLE_SECONDS:
                self._clear()  # moving normally again: a bump or a jump, not a fall
        return []

    def _reset_still(self) -> None:
        self._still_since = None
        self._still = []

    def _clear(self) -> None:
        self._impact_ts = None
        self._peak_g = 0.0
        self._reset_still()


class GeofenceDetector:
    """Alerts once on leaving the safe zone, re-alerts every GEOFENCE_REALERT_SECONDS while outside."""

    def __init__(self) -> None:
        self.home: tuple[float, float, float] | None = None  # lat, lng, radius_m
        self.inside: bool | None = None  # None until the first reading with a home set
        self.distance_m: float | None = None
        self._last_alert_ts = -math.inf

    def set_home(self, lat: float | None, lng: float | None, radius_m: float) -> None:
        self.home = (lat, lng, radius_m) if lat is not None and lng is not None else None

    def update(self, r: SensorReading) -> list[Detection]:
        if self.home is None:
            self.inside = self.distance_m = None
            return []
        lat, lng, radius = self.home
        d = self.distance_m = haversine_m(lat, lng, r.lat, r.lng)

        if self.inside is not False:  # inside, or the first reading
            if d > radius:
                self.inside = False
                self._last_alert_ts = r.ts
                return [Detection("geofence_exit", f"Patient left the safe zone, {d:.0f} meters from home", "critical")]
            self.inside = True
            return []

        # Outside: require coming back past a small margin so GPS jitter at the edge doesn't flap
        if d < radius - min(settings.GEOFENCE_HYSTERESIS_M, radius / 4):
            self.inside = True
            return [Detection("geofence_return", "Patient returned to the safe zone", "info", alert=False)]
        if r.ts - self._last_alert_ts >= settings.GEOFENCE_REALERT_SECONDS:
            self._last_alert_ts = r.ts
            return [Detection(
                "geofence_exit", f"Patient is still outside the safe zone, {d:.0f} meters from home", "critical"
            )]
        return []


@dataclass
class VitalsRule:
    type: str
    breached: Callable[[SensorReading], bool]
    message: Callable[[SensorReading], str]


class VitalsDetector:
    """Warning when a value stays out of range for VITALS_SUSTAIN_SECONDS; per-rule cooldown."""

    def __init__(self) -> None:
        s = settings
        self.rules = [
            VitalsRule("heart_rate_high", lambda r: r.heart_rate > s.HEART_RATE_HIGH,
                       lambda r: f"Heart rate high: {r.heart_rate} bpm (limit {s.HEART_RATE_HIGH})"),
            VitalsRule("heart_rate_low", lambda r: r.heart_rate < s.HEART_RATE_LOW,
                       lambda r: f"Heart rate low: {r.heart_rate} bpm (limit {s.HEART_RATE_LOW})"),
            VitalsRule("spo2_low", lambda r: r.spo2 < s.SPO2_LOW,
                       lambda r: f"Blood oxygen low: SpO2 {r.spo2}% (limit {s.SPO2_LOW}%)"),
            VitalsRule("battery_low", lambda r: r.battery < s.BATTERY_LOW,
                       lambda r: f"Wearable battery low: {r.battery:.0f}%"),
        ]
        self._breach_since: dict[str, float] = {}
        self._last_alert: dict[str, float] = {}

    def update(self, r: SensorReading) -> list[Detection]:
        detections = []
        for rule in self.rules:
            if not rule.breached(r):
                self._breach_since.pop(rule.type, None)
                continue
            since = self._breach_since.setdefault(rule.type, r.ts)
            last = self._last_alert.get(rule.type, -math.inf)
            if r.ts - since >= settings.VITALS_SUSTAIN_SECONDS and r.ts - last >= settings.VITALS_COOLDOWN_SECONDS:
                self._last_alert[rule.type] = r.ts
                detections.append(Detection(rule.type, rule.message(r), "warning"))
        return detections


class DetectionEngine:
    """Runs every detector on each reading."""

    def __init__(self) -> None:
        self.fall = FallDetector()
        self.geofence = GeofenceDetector()
        self.vitals = VitalsDetector()

    def set_home(self, lat: float | None, lng: float | None, radius_m: float) -> None:
        self.geofence.set_home(lat, lng, radius_m)

    def process(self, r: SensorReading) -> list[Detection]:
        return [*self.fall.update(r), *self.geofence.update(r), *self.vitals.update(r)]
