"""Runs the active SensorSource at SENSOR_HZ, feeds the detectors and turns detections into alerts."""
import asyncio
import contextlib
import logging

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import Patient
from app.sensors.base import SensorReading, SensorSource
from app.sensors.simulated import SimulatedSource
from app.services.alerts import create_alert, record_event
from app.services.detectors import Detection, DetectionEngine
from app.services.ws_manager import manager

log = logging.getLogger("alzacare.sensors")


class SensorMonitor:
    def __init__(self, source: SensorSource) -> None:
        self.source = source
        self.engine = DetectionEngine()
        self.latest: SensorReading | None = None
        self._task: asyncio.Task | None = None
        self._pending: set[asyncio.Task] = set()  # alert tasks in flight

    @property
    def scenario(self) -> str | None:
        return self.source.scenario if isinstance(self.source, SimulatedSource) else None

    def load_patient(self) -> None:
        """(Re)load the home location and safe radius. Call after the patient is updated."""
        with SessionLocal() as db:
            patient = db.scalar(select(Patient).order_by(Patient.id))
        if patient is None:
            self.engine.set_home(None, None, 0)
            return
        self.engine.set_home(patient.home_lat, patient.home_lng, patient.safe_radius_m)
        if isinstance(self.source, SimulatedSource) and patient.home_lat is not None and patient.home_lng is not None:
            self.source.set_home(patient.home_lat, patient.home_lng)

    def start(self) -> None:
        self.load_patient()
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

    def sensor_message(self) -> dict:
        geo = self.engine.geofence
        return {
            "kind": "sensor",
            "scenario": self.scenario,
            "simulated": self.source.simulated,
            "reading": self.latest.to_dict() if self.latest else None,
            "in_safe_zone": geo.inside,
            "distance_from_home_m": round(geo.distance_m, 1) if geo.distance_m is not None else None,
        }

    async def _run(self) -> None:
        loop = asyncio.get_running_loop()
        interval = 1 / settings.SENSOR_HZ
        per_broadcast = max(1, round(settings.SENSOR_BROADCAST_SECONDS * settings.SENSOR_HZ))
        next_tick, count = loop.time(), 0
        while True:
            try:
                self.latest = self.source.read()
                for detection in self.engine.process(self.latest):
                    self._dispatch(detection)
                count += 1
                if count % per_broadcast == 0:
                    await manager.broadcast(self.sensor_message())
            except Exception:
                log.exception("Sensor loop error; retrying in 1 s")
                await asyncio.sleep(1)
                next_tick = loop.time()

            next_tick += interval
            delay = next_tick - loop.time()
            if delay < -1:  # fell far behind (e.g. a blocked event loop): skip ahead instead of bursting
                next_tick, delay = loop.time(), 0
            await asyncio.sleep(max(0.0, delay))

    def _dispatch(self, d: Detection) -> None:
        """Send the alert in its own task so a slow Telegram call never stalls the sensor loop."""
        source = "simulated" if self.source.simulated else "real"
        log.info("Detected %s: %s", d.type, d.message)
        if d.alert:
            coro = create_alert(d.type, d.message, d.severity, source=source)
        else:
            coro = record_event(d.type, d.message, d.severity, source=source)
        task = asyncio.create_task(coro)
        self._pending.add(task)
        task.add_done_callback(self._on_dispatched)

    def _on_dispatched(self, task: asyncio.Task) -> None:
        self._pending.discard(task)
        if not task.cancelled() and task.exception():
            log.error("Saving detection failed", exc_info=task.exception())


# Swap SimulatedSource() for SerialSource(port) once the real wearable is connected
monitor = SensorMonitor(SimulatedSource())
