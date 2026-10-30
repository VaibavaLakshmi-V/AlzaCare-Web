"""Simulated wearable: realistic accelerometer, GPS and vitals for demo scenarios.

Each read() advances simulated time by DT, so the server gets real-time data at 10 Hz
while tests can step through minutes of scenario time instantly.
"""
import math
import random

from app.config import settings
from app.sensors.base import SensorReading, SensorSource

SCENARIOS = ("sit", "walk", "fall", "wander", "return_home", "high_heart_rate", "low_battery", "normal")

DT = 0.1  # simulated seconds per reading (10 Hz)
METERS_PER_DEG_LAT = 111_320
WALK_SPEED = 1.1  # m/s
NEAR_HOME_M = 40  # normal walking stays within this distance of home
MAX_TURN = math.radians(30)  # max heading change per second, keeps the GPS path smooth
GPS_NOISE_M = 1.5
FALL_STEP = 10  # the fall starts 1 s (10 readings) after the scenario is chosen
NATURAL_BATTERY_FLOOR = 20.0  # slow drain stops here; use the low_battery scenario to go lower


class SimulatedSource(SensorSource):
    simulated = True

    def __init__(self, seed: int | None = None) -> None:
        self.rng = random.Random(seed)
        self.home_lat, self.home_lng = 0.0, 0.0  # set_home() is called before the first read
        self.t = 0.0
        self.north = self.east = 0.0  # meters from home
        self.heading = self.rng.uniform(0, 2 * math.pi)  # radians, 0 = north
        self.heart_rate = 80.0
        self.battery = 96.0
        self.scenario = "walk"
        self._scenario_start = 0.0
        self._wander_bearing = 0.0

    def set_home(self, lat: float, lng: float) -> None:
        self.home_lat, self.home_lng = lat, lng

    def set_scenario(self, name: str) -> None:
        if name not in SCENARIOS:
            raise ValueError(f"Unknown scenario {name!r}")
        self.scenario = name
        self._scenario_start = self.t
        if name == "wander":
            # Keep heading away from home: current direction if already out, else a random one
            out = math.hypot(self.north, self.east) > 5
            self._wander_bearing = math.atan2(self.east, self.north) if out else self.rng.uniform(0, 2 * math.pi)

    def read(self) -> SensorReading:
        self.t += DT
        step = round((self.t - self._scenario_start) / DT)  # readings since the scenario started
        speed = self._move(step)
        ax, ay, az = self._accel(step, speed)
        self._update_vitals(speed)
        lat, lng = self._gps()
        return SensorReading(
            ts=round(self.t, 1),
            ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
            lat=round(lat, 7), lng=round(lng, 7),
            heart_rate=round(self.heart_rate),
            spo2=min(99, max(94, round(97 + self.rng.gauss(0, 0.6)))),
            battery=round(self.battery, 1),
        )

    # --- movement ---
    def _move(self, step: int) -> float:
        """Advance the position along a smooth path; returns the speed in m/s."""
        dist = math.hypot(self.north, self.east)
        toward_home = math.atan2(-self.east, -self.north)

        if self.scenario == "sit" or (self.scenario == "fall" and step >= FALL_STEP):
            return 0.0
        if self.scenario == "wander":
            speed = settings.SIM_WANDER_SPEED_MPS
            desired = self._wander_bearing + 0.3 * math.sin(0.1 * self.t)  # gentle curves
        elif self.scenario == "return_home":
            if dist < 3:
                return 0.0
            speed, desired = settings.SIM_WANDER_SPEED_MPS, toward_home
        else:  # walking around near home
            speed = WALK_SPEED
            desired = toward_home if dist > NEAR_HOME_M else self.heading + self.rng.gauss(0, 0.3)

        turn = (desired - self.heading + math.pi) % (2 * math.pi) - math.pi
        self.heading += max(-MAX_TURN * DT, min(MAX_TURN * DT, turn))
        self.north += speed * DT * math.cos(self.heading)
        self.east += speed * DT * math.sin(self.heading)
        return speed

    def _gps(self) -> tuple[float, float]:
        north = self.north + self.rng.gauss(0, GPS_NOISE_M)
        east = self.east + self.rng.gauss(0, GPS_NOISE_M)
        lat = self.home_lat + north / METERS_PER_DEG_LAT
        lng = self.home_lng + east / (METERS_PER_DEG_LAT * math.cos(math.radians(self.home_lat)))
        return lat, lng

    # --- accelerometer (g) ---
    def _noise(self, sd: float) -> float:
        return self.rng.gauss(0, sd)

    def _accel(self, step: int, speed: float) -> tuple[float, float, float]:
        if self.scenario == "fall" and step >= FALL_STEP:
            return self._fall_accel(step - FALL_STEP)
        if speed == 0:  # upright and still
            return self._noise(0.008), self._noise(0.008), 1 + self._noise(0.008)
        # Walking: vertical bounce at the step cadence, small sway sideways
        cadence, bump = (1.8, 0.18) if speed < 2 else (2.4, 0.3)
        phase = 2 * math.pi * cadence * self.t
        return (
            0.1 * math.sin(phase / 2) + self._noise(0.03),
            0.06 * math.cos(phase) + self._noise(0.03),
            1 + bump * math.sin(phase) + 0.05 * math.sin(2 * phase) + self._noise(0.03),
        )

    def _fall_accel(self, k: int) -> tuple[float, float, float]:
        """k = readings since the fall began."""
        if k < 3:  # ~0.3 s free fall: magnitude drops well below 1 g
            return self._noise(0.05), self._noise(0.05), 0.3 + self._noise(0.05)
        if k == 3:  # impact with the floor: ~3.1 g
            return 1.3, 0.8, 2.7
        if k < 10:  # bouncing and settling, now lying on one side (gravity mostly on x)
            decay = math.exp(-0.5 * (k - 3))
            return 0.98 + 0.5 * decay * math.sin(3 * k), 0.3 * decay * math.cos(3 * k), 0.15 + 0.4 * decay * math.sin(4 * k)
        # lying still on the floor
        return 0.98 + self._noise(0.008), self._noise(0.008), 0.15 + self._noise(0.008)

    # --- vitals ---
    def _update_vitals(self, speed: float) -> None:
        if self.scenario == "high_heart_rate":
            target = 138
        elif self.scenario == "fall":
            target = 100  # stress after falling
        elif speed == 0:
            target = 72
        else:
            target = 86 if speed < 2 else 104
        self.heart_rate += (target - self.heart_rate) * 0.05 + self.rng.gauss(0, 0.4)

        if self.scenario == "low_battery":
            self.battery = max(12.0, self.battery - 2 * DT)  # fast drain to 12%
        elif self.scenario == "normal" and self.battery < 100:
            self.battery = min(100.0, self.battery + 5 * DT)  # back on the charger
        elif self.battery > NATURAL_BATTERY_FLOOR:
            self.battery -= DT / 240  # about 1% every 4 minutes
