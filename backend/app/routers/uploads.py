"""Serves event snapshots saved in backend/uploads/."""
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/uploads", tags=["uploads"], dependencies=[Depends(get_current_user)])

SAFE_NAME = re.compile(r"^[\w-][\w.-]*$")  # no slashes, backslashes or leading dot


@router.get("/{filename}")
def get_upload(filename: str):
    path = settings.UPLOADS_DIR / filename
    if not SAFE_NAME.match(filename) or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
