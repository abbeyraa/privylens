from pdfminer.high_level import extract_text
import logging
import os
import tempfile
import fitz  # PyMuPDF
from app.services.ocr import extract_ocr_text

logger = logging.getLogger(__name__)


def extract_pdf_text(path: str) -> str:
    """
    Mengekstrak teks dari file PDF menggunakan pdfminer.
    Jika tidak ada text layer, akan convert PDF ke gambar dan gunakan OCR.
    Berjalan sepenuhnya offline tanpa koneksi internet.
    
    Args:
        path: Path ke file PDF
        
    Returns:
        String berisi teks yang diekstrak, atau string kosong jika gagal
    """
    try:
        # Coba ekstrak text langsung dari PDF
        text = extract_text(path)
        
        # Jika tidak ada text atau text terlalu sedikit, kemungkinan PDF adalah scanned image
        if not text or not text.strip() or len(text.strip()) < 50:
            logger.info(f"No text layer found in PDF: {path}. Attempting OCR on PDF pages...")
            return extract_pdf_text_with_ocr(path)
        
        return text
    except FileNotFoundError:
        logger.error(f"PDF file not found: {path}")
        raise
    except Exception as e:
        logger.error(f"Error extracting PDF text from {path}: {str(e)}")
        # Fallback: coba dengan OCR
        try:
            logger.info("Falling back to OCR extraction...")
            return extract_pdf_text_with_ocr(path)
        except Exception as ocr_error:
            logger.error(f"OCR fallback also failed: {str(ocr_error)}")
            return ""


def extract_pdf_text_with_ocr(path: str) -> str:
    """
    Convert PDF pages ke gambar dan ekstrak text menggunakan OCR.
    
    Args:
        path: Path ke file PDF
        
    Returns:
        String berisi teks yang diekstrak dari semua halaman
    """
    temp_images = []
    try:
        # Open PDF dengan PyMuPDF
        pdf_document = fitz.open(path)
        
        if pdf_document.page_count == 0:
            logger.warning(f"No pages found in PDF: {path}")
            return ""
        
        all_text = []
        
        # Process each page
        for page_num in range(pdf_document.page_count):
            try:
                page = pdf_document[page_num]
                
                # Convert page to image (300 DPI untuk kualitas baik)
                mat = fitz.Matrix(300/72, 300/72)  # 300 DPI
                pix = page.get_pixmap(matrix=mat)
                
                # Save image temporarily
                temp_dir = tempfile.gettempdir()
                temp_image_path = os.path.join(temp_dir, f"pdf_page_{page_num}_{os.path.basename(path)}.png")
                pix.save(temp_image_path)
                temp_images.append(temp_image_path)
                
                # Extract text using OCR
                page_text = extract_ocr_text(temp_image_path)
                if page_text:
                    all_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
                
            except Exception as e:
                logger.warning(f"Error processing page {page_num + 1} of PDF {path}: {str(e)}")
                continue
        
        pdf_document.close()
        
        result = "\n\n".join(all_text)
        return result if result else ""
    
    except Exception as e:
        logger.error(f"Error converting PDF to images: {str(e)}")
        return ""
    
    finally:
        # Cleanup temporary images
        for temp_img in temp_images:
            try:
                if os.path.exists(temp_img):
                    os.remove(temp_img)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp image {temp_img}: {str(e)}")
