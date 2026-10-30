"""Face encoding for known-person enrollment."""
import io
from dataclasses import dataclass

import face_recognition
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_SIDE = 1600  # downscale big phone photos so HOG detection stays fast


class FaceError(ValueError):
    """Photo can't be enrolled; the message is safe to show to the user."""


@dataclass
class EncodedFace:
    image: Image.Image  # normalized RGB image, ready to save
    encoding: list[float]  # 128 floats


def encode_single_face(data: bytes) -> EncodedFace:
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img).convert("RGB")  # respect phone camera rotation
    except (UnidentifiedImageError, OSError):
        raise FaceError("The uploaded file is not a valid image (use JPG or PNG).")

    img.thumbnail((MAX_SIDE, MAX_SIDE))
    pixels = np.array(img)

    locations = face_recognition.face_locations(pixels)
    if not locations:
        raise FaceError("No face found in the photo. Upload a clear, well-lit, front-facing photo.")
    if len(locations) > 1:
        raise FaceError(f"Found {len(locations)} faces in the photo. Upload a photo with exactly one person.")

    encoding = face_recognition.face_encodings(pixels, known_face_locations=locations)[0]
    return EncodedFace(image=img, encoding=encoding.tolist())
