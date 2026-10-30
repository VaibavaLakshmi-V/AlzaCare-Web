"""Live face recognition on webcam frames (~2 per second from the browser)."""
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.auth import get_current_user
from app.schemas import RecognitionResult, RecognizedFace
from app.services.alerts import create_alert, record_event
from app.services.recognition import (
    FrameError,
    announcement_text,
    load_frame,
    match_faces,
    save_snapshot,
    tracker,
)

router = APIRouter(prefix="/recognize", tags=["recognition"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=RecognitionResult)
async def recognize(background: BackgroundTasks, frame: UploadFile = File(..., description="Webcam frame (JPEG)")):
    try:
        img = await run_in_threadpool(load_frame, await frame.read())
    except FrameError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    matches = await run_in_threadpool(match_faces, img)
    first_by_key = {m.key: m for m in reversed(matches)}
    announce = [first_by_key[key] for key in tracker.update(set(first_by_key))]

    # Events/alerts run after the response so the browser can speak without waiting on Telegram
    for match in announce:
        if match.known:
            background.add_task(record_event, "face_known", f"Recognized {match.name} ({match.relationship})", "info")
        else:
            snapshot = await run_in_threadpool(save_snapshot, img)
            background.add_task(
                create_alert, "face_unknown", "Unknown person detected near the patient", "warning",
                snapshot_path=snapshot,
            )

    speak = ". ".join(announcement_text(m) for m in announce) or None
    return RecognitionResult(
        faces=[
            RecognizedFace(
                name=m.name, relationship=m.relationship, status="known" if m.known else "unknown", distance=m.distance
            )
            for m in matches
        ],
        speak=speak,
        state="no_face" if not matches else "announced" if speak else "tracking",
    )
