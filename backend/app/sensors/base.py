"""Sensor source abstraction. Detection code only ever sees SensorReading objects."""
import math
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class SensorReading:
    ts: float  # seconds (monotonic); detectors use this for all timing
    ax: float  # acceleration in g
    ay: float
    az: float
    lat: float
    lng: float
    heart_rate: int  # bpm
    spo2: int  # %
    battery: float  # %

    @property
    def accel_magnitude(self) -> float:
        return math.sqrt(self.ax**2 + self.ay**2 + self.az**2)

    def to_dict(self) -> dict:
        return asdict(self)


class SensorSource(ABC):
    """Anything that produces wearable readings: simulator, serial port, BLE, ..."""

    simulated: bool = False  # only used to label alerts honestly, never by detection logic

    @abstractmethod
    def read(self) -> SensorReading:
        """Return the newest reading. Must not block: it is called 10 times per second."""
