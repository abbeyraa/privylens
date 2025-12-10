import os
import uuid
from fastapi import UploadFile

TEMP_DIR = "temp_files"

os.makedirs(TEMP_DIR, exist_ok=True)


def save_temp_file(file: UploadFile):
    ext = file.filename.split(".")[-1] if file.filename else ""
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(TEMP_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    return path


def cleanup_temp(path: str):
    if os.path.exists(path):
        try:
            os.remove(path)
        except PermissionError:
            import time
            time.sleep(0.1)
            try:
                os.remove(path)
            except:
                pass
        except Exception:
            pass
