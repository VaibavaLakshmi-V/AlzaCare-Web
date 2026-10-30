"""Enroll, list and remove people the patient should recognize."""
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import BASE_DIR, settings
from app.database import get_db
from app.models import KnownPerson
from app.schemas import KnownPersonOut
from app.services.faces import FaceError, encode_single_face

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
    return person


@router.get("", response_model=list[KnownPersonOut])
def list_persons(db: Session = Depends(get_db)):
    return db.scalars(select(KnownPerson).order_by(KnownPerson.name)).all()


@router.delete("/{person_id}", status_code=204)
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person = db.get(KnownPerson, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Known person not found")
    (BASE_DIR / person.photo_path).unlink(missing_ok=True)
    db.delete(person)
    db.commit()
