"""Wearable connected over a serial port (USB / Bluetooth SPP).

STUB: to be used when the real wearable hardware is connected. Not implemented yet.

Intended design: a background thread reads lines from the port (e.g. with pyserial),
parses them into SensorReading objects (ts = time.monotonic()) and keeps the newest one;
read() returns that latest reading so it never blocks the 10 Hz sensor loop.
"""
from app.sensors.base import SensorReading, SensorSource


class SerialSource(SensorSource):
    simulated = False

    def __init__(self, port: str, baudrate: int = 115200) -> None:
        self.port = port
        self.baudrate = baudrate

    def read(self) -> SensorReading:
        raise NotImplementedError("SerialSource is a stub, to be used when the real wearable hardware is connected")
