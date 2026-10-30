# AlzaCare Web

Caregiver monitoring prototype for an Alzheimer's patient: face recognition, fall detection, geofencing and alerts.

- `backend/`: FastAPI + SQLAlchemy + SQLite
- `frontend/`: React + Vite + Tailwind (coming later)
- `docs/`: project documentation

## Running the backend

```
cd backend
copy .env.example .env
C:\Users\vaibu\anaconda3\envs\yolo-env1\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check: http://localhost:8000/health. API docs: http://localhost:8000/docs
