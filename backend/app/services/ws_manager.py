"""Tracks connected WebSocket clients and broadcasts JSON to all of them."""
import logging

from fastapi import WebSocket

log = logging.getLogger("alzacare.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.clients.add(websocket)
        log.info("WebSocket client connected (%d total)", len(self.clients))

    def disconnect(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)
        log.info("WebSocket client disconnected (%d total)", len(self.clients))

    async def broadcast(self, data: dict) -> None:
        # Iterate over a copy; drop clients whose connection has died
        for ws in list(self.clients):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()
