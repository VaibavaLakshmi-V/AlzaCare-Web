"""Enroll, list and remove people the patient should recognize."""
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import BASE_DIR, settings
from app.database import get_db
from app.models import KnownPerson
from app.schemas import KnownPersonOut
from app.services.faces import FaceError, encode_single_face
from app.services.recognition import face_cache

router = APIRouter(prefix="/known-persons", tags=["known persons"], dependencies=[Depends(get_current_user)])


# Plain `def` so the CPU-heavy face detection runs in FastAPI's threadpool
@router.post("", response_model=KnownPersonOut, status_code=201)
def enroll_person(
    name: str = Form(..., min_length=1, max_length=100),
    relationship: str = Form(..., min_length=1, max_length=100),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        face = encode_single_face(photo.file.read())
    except FaceError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    settings.FACES_DIR.mkdir(exist_ok=True)
    photo_file = settings.FACES_DIR / f"{uuid.uuid4().hex}.jpg"
    face.image.save(photo_file, "JPEG", quality=90)

    person = KnownPerson(
        name=name,
        relationship=relationship,
        photo_path=photo_file.relative_to(BASE_DIR).as_posix(),
        face_encoding=face.encoding,
    )
    db.add(person)
    db.commit()
    face_cache.reload()
    return person


@router.get("", response_model=list[KnownPersonOut])
def list_persons(db: Session = Depends(get_db)):
    return db.scalars(select(KnownPerson).order_by(KnownPerson.name)).all()


def _get_person(person_id: int, db: Session) -> KnownPerson:
    person = db.get(KnownPerson, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Known person not found")
    return person


@router.get("/{person_id}/photo")
def get_photo(person_id: int, db: Session = Depends(get_db)):
    path = BASE_DIR / _get_person(person_id, db).photo_path
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo file missing")
    return FileResponse(path, media_type="image/jpeg")


@router.delete("/{person_id}", status_code=204)
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person = _get_person(person_id, db)
    (BASE_DIR / person.photo_path).unlink(missing_ok=True)
    db.delete(person)
    db.commit()
    face_cache.reload()
