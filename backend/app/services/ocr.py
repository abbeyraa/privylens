from paddleocr import PaddleOCR  # type: ignore
import logging
import os

logger = logging.getLogger(__name__)

# Initialize OCR engine once (lazy loading)
_ocr_engine = None


def _get_ocr_engine():
    """Lazy initialization of OCR engine to avoid loading on import."""
    global _ocr_engine
    if _ocr_engine is None:
        try:
            _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
            logger.info("PaddleOCR engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {str(e)}")
            raise
    return _ocr_engine


def extract_ocr_text(path: str) -> str:
    """
    Mengekstrak teks dari gambar menggunakan PaddleOCR.
    Berjalan sepenuhnya offline tanpa koneksi internet.

    Args:
        path: Path ke file gambar (PNG, JPG, JPEG)

    Returns:
        String berisi teks yang diekstrak, atau string kosong jika gagal
    """
    try:
        # Validasi file exists
        if not os.path.exists(path):
            logger.error(f"Image file not found: {path}")
            raise FileNotFoundError(f"Image file not found: {path}")

        # Get OCR engine
        ocr_engine = _get_ocr_engine()

        # Perform OCR (cls already configured in initialization)
        result = ocr_engine.ocr(path)

        if not result or not result[0]:
            logger.warning(f"No text detected in image: {path}")
            return ""

        # Extract text from OCR result
        text_lines = []
        for block in result:
            if block:
                for line in block:
                    if line and len(line) > 1:
                        text_lines.append(line[1][0])

        if not text_lines:
            logger.warning(f"No text extracted from image: {path}")
            return ""

        text = "\n".join(text_lines)
        return text

    except FileNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error extracting OCR text from {path}: {str(e)}")
        # Fallback: return empty string instead of raising
        return ""
