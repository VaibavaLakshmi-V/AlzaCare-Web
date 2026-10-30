"""Sends an enrolled person's photo to POST /recognize 10 times and prints each response.

Expected: frames 1-2 "tracking", frame 3 "announced" (with speak text), frames 4-10 "tracking".

Run from backend/ while the server is running:
    C:\\Users\\vaibu\\anaconda3\\envs\\yolo-env1\\python.exe tests/test_recognition.py

The server remembers announcements for COOLDOWN_SECONDS (60 s), so running this again
within a minute shows no announcement. That is the cooldown working, not a failure.
"""
import argparse
import json
import sys
import time

import httpx


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--username", default="caregiver")
    parser.add_argument("--password", default="alza123")
    parser.add_argument("--frames", type=int, default=10)
    parser.add_argument("--interval", type=float, default=0.5, help="seconds between frames (browser sends ~2/s)")
    args = parser.parse_args()

    with httpx.Client(base_url=args.base_url, timeout=30) as client:
        login = client.post("/auth/login", data={"username": args.username, "password": args.password})
        login.raise_for_status()
        client.headers["Authorization"] = f"Bearer {login.json()['access_token']}"

        people = client.get("/known-persons").json()
        if not people:
            print("No known persons enrolled. Enroll one with POST /known-persons first.")
            return 1
        person = people[0]
        photo = client.get(f"/known-persons/{person['id']}/photo")
        photo.raise_for_status()

        print(f"Sending {person['name']} ({person['relationship']})'s enrolled photo "
              f"{args.frames} times, {args.interval}s apart\n")
        announcements = 0
        for i in range(1, args.frames + 1):
            start = time.perf_counter()
            resp = client.post("/recognize", files={"frame": ("frame.jpg", photo.content, "image/jpeg")})
            elapsed_ms = (time.perf_counter() - start) * 1000
            resp.raise_for_status()
            body = resp.json()
            announcements += body["speak"] is not None
            print(f"frame {i:2}  {elapsed_ms:5.0f} ms  {json.dumps(body)}")
            time.sleep(args.interval)

        latest = client.get("/events", params={"type": "face_known", "limit": 1}).json()
        print(f"\nLatest face_known event: {latest[0] if latest else None}")

    print(f"Announcements: {announcements}")
    if announcements == 1:
        print("PASS: exactly one announcement")
        return 0
    if announcements == 0:
        print("No announcement. If this ran within 60 s of a previous run, the cooldown is still active; wait and retry.")
    else:
        print("FAIL: more than one announcement")
    return 1


if __name__ == "__main__":
    sys.exit(main())
