"""Runs the real detectors against the simulator, one scenario at a time, and prints what fired.

No server, database or Telegram needed: readings go straight from SimulatedSource into
DetectionEngine, stepping simulated time as fast as possible.

Run from backend/:
    C:\\Users\\vaibu\\anaconda3\\envs\\yolo-env1\\python.exe tests/test_sensors.py
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.sensors.simulated import SimulatedSource  # noqa: E402
from app.services.detectors import DetectionEngine  # noqa: E402

HOME = (13.0827, 80.2707, 200.0)  # the seeded demo patient: Chennai, 200 m safe radius

# (label, scenario, simulated seconds, expected detection types)
CASES = [
    ("fall", "fall", 60, ["fall"]),
    ("wander", "wander", 150, ["geofence_exit"]),
    ("return_home", "return_home", 150, ["geofence_return"]),
    ("high_heart_rate", "high_heart_rate", 60, ["heart_rate_high"]),
    ("low_battery", "low_battery", 60, ["battery_low"]),
    # Extra checks: re-alert while outside, and no false alarms in normal activity
    ("wander, 4 min (re-alert)", "wander", 240, ["geofence_exit", "geofence_exit"]),
    ("walk, 5 min (no alerts)", "walk", 300, []),
    ("sit, 2 min (no alerts)", "sit", 120, []),
    ("normal, 2 min (no alerts)", "normal", 120, []),
]


def run(src: SimulatedSource, engine: DetectionEngine, seconds: float) -> list:
    fired = []
    for _ in range(round(seconds * 10)):
        reading = src.read()
        fired += [(reading, d) for d in engine.process(reading)]
    return fired


def run_case(label: str, scenario: str, seconds: float, expected: list[str], seed: int, verbose: bool) -> bool:
    src = SimulatedSource(seed=seed)
    src.set_home(*HOME[:2])
    engine = DetectionEngine()
    engine.set_home(*HOME)

    if scenario == "return_home":
        # Setup: wander until outside the zone (that exit alert belongs to the setup, not this case)
        src.set_scenario("wander")
        while engine.geofence.inside is not False:
            run(src, engine, 0.1)
        run(src, engine, 5)
        setup = f"  setup: wandered out to {engine.geofence.distance_m:.0f} m, then return_home"
    else:
        setup = None

    src.set_scenario(scenario)
    start = src.t
    fired = run(src, engine, seconds)
    ok = [d.type for _, d in fired] == expected

    if verbose:
        print(f"{'PASS' if ok else 'FAIL'}  {label}  ({seconds} s simulated, expected {expected or 'nothing'})")
        if setup:
            print(setup)
        for reading, d in fired:
            kind = "alert" if d.alert else "event"
            print(f"  +{reading.ts - start:5.1f}s  {kind:<5} {d.severity:<8} {d.type:<16} {d.message}")
        if not fired:
            print("  (nothing fired)")
        last = src.read()
        print(f"  end: accel {last.accel_magnitude:.2f} g, HR {last.heart_rate}, SpO2 {last.spo2}%, "
              f"battery {last.battery:.0f}%, {engine.geofence.distance_m:.0f} m from home\n")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=1, help="simulator random seed")
    parser.add_argument("--runs", type=int, default=1, help="repeat with this many seeds and summarise")
    args = parser.parse_args()

    if args.runs == 1:
        results = [run_case(*case, seed=args.seed, verbose=True) for case in CASES]
        print(f"{sum(results)}/{len(results)} cases passed")
        return 0 if all(results) else 1

    failures = 0
    for label, *rest in CASES:
        passed = sum(run_case(label, *rest, seed=s, verbose=False) for s in range(args.seed, args.seed + args.runs))
        failures += args.runs - passed
        print(f"{label:<28} {passed}/{args.runs} seeds passed")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
