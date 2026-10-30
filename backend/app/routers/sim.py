"""Controls for the simulated wearable."""
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.schemas import ScenarioIn, SimState
from app.sensors.simulated import SCENARIOS, SimulatedSource
from app.services.sensor_monitor import monitor

log = logging.getLogger("alzacare.sensors")

router = APIRouter(prefix="/sim", tags=["simulator"], dependencies=[Depends(get_current_user)])


def _simulator() -> SimulatedSource:
    if not isinstance(monitor.source, SimulatedSource):
        raise HTTPException(status_code=409, detail="The active sensor source is real hardware, not the simulator")
    return monitor.source


# async so these run on the event loop, the same thread as the sensor loop
@router.get("/state", response_model=SimState)
async def sim_state():
    return SimState(scenario=_simulator().scenario, scenarios=list(SCENARIOS), reading=monitor.latest)


@router.post("/scenario", response_model=SimState)
async def set_scenario(body: ScenarioIn):
    _simulator().set_scenario(body.scenario)
    log.info("Simulator scenario -> %s", body.scenario)
    return await sim_state()
