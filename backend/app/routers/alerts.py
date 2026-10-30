"""Manual trigger to exercise the full alert chain."""
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.schemas import AlertResult
from app.services.alerts import create_alert

router = APIRouter(prefix="/alerts", tags=["alerts"], dependencies=[Depends(get_current_user)])


@router.post("/test", response_model=AlertResult)
async def test_alert():
    return await create_alert("test", "Test alert from AlzaCare Web: the alert chain is working.", "warning")
