from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.pdf_parser import extract_pdf_text
from app.services.docx_parser import extract_docx_text
from app.services.ocr import extract_ocr_text
from app.utils.file_handler import save_temp_file, cleanup_temp
from app.utils.text_cleaner import normalize_text
import uuid

router = APIRouter()

# Supported file types
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}


@router.post("/")
async def ingest_file(file: UploadFile = File(...)):
    """
    Endpoint untuk mengunggah dan mengekstrak teks dari dokumen.
    Mendukung PDF, DOCX, dan gambar (PNG/JPG/JPEG).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    # Validasi tipe file
    file_ext = None
    filename_lower = file.filename.lower()
    for ext in SUPPORTED_EXTENSIONS:
        if filename_lower.endswith(ext):
            file_ext = ext
            break
    
    if not file_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    
    # Simpan file sementara
    temp_path = None
    try:
        temp_path = save_temp_file(file)
        
        # Ekstrak teks berdasarkan tipe file
        text = ""
        if file_ext == ".pdf":
            text = extract_pdf_text(temp_path)
        elif file_ext == ".docx":
            text = extract_docx_text(temp_path)
        elif file_ext in (".png", ".jpg", ".jpeg"):
            text = extract_ocr_text(temp_path)
        
        # Normalisasi teks
        clean_text = normalize_text(text)
        
        if not clean_text:
            raise HTTPException(
                status_code=422,
                detail="Failed to extract text from file. File may be empty or corrupted."
            )
        
        # Generate file ID untuk tracking
        file_id = str(uuid.uuid4())
        
        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "extracted_text": clean_text
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        # Cleanup file sementara
        if temp_path:
            cleanup_temp(temp_path)
