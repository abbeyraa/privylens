from docx import Document
import logging

logger = logging.getLogger(__name__)


def extract_docx_text(path: str) -> str:
    """
    Mengekstrak teks dari file DOCX menggunakan python-docx.
    Berjalan sepenuhnya offline tanpa koneksi internet.
    
    Args:
        path: Path ke file DOCX
        
    Returns:
        String berisi teks yang diekstrak, atau string kosong jika gagal
    """
    try:
        doc = Document(path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        
        if not paragraphs:
            logger.warning(f"No text extracted from DOCX: {path}")
            return ""
        
        text = "\n".join(paragraphs)
        return text
    except FileNotFoundError:
        logger.error(f"DOCX file not found: {path}")
        raise
    except Exception as e:
        logger.error(f"Error extracting DOCX text from {path}: {str(e)}")
        # Fallback: return empty string instead of raising
        return ""
