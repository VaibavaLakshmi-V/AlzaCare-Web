"""Live event feed. Connect to /ws?token=<JWT>."""
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.auth import user_from_token
from app.database import SessionLocal
from app.services.ws_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def events_ws(websocket: WebSocket, token: str = Query("")):
    with SessionLocal() as db:
        user = user_from_token(token, db)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep the connection open; client messages are ignored
    except WebSocketDisconnect:
        manager.disconnect(websocket)
