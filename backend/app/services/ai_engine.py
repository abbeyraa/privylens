import subprocess
import logging
import os
import sys
import time
from tqdm import tqdm

logger = logging.getLogger(__name__)

# Prompt template untuk analisis dokumen
ANALYSIS_PROMPT = """Analyze the following document text and provide:
1. A concise summary (2-3 sentences)
2. Key findings or important points
3. Overall context and meaning

Document text:
{text}

Please provide a comprehensive analysis:"""

OLLAMA_PATH = r"C:\Users\abbyr\AppData\Local\Programs\Ollama\ollama.exe"


def _check_ollama_installed() -> bool:
    """Memeriksa apakah Ollama terinstall di path (OLLAMA_PATH) atau di PATH environment."""
    # Cek file sesuai variabel OLLAMA_PATH
    if OLLAMA_PATH and os.path.isfile(OLLAMA_PATH) and os.access(OLLAMA_PATH, os.X_OK):
        return True
    # Jika tidak, coba cari di PATH
    from shutil import which

    return which("ollama") is not None


def _get_ollama_cmd():
    """Mendapatkan path executable ollama, dari OLLAMA_PATH jika ada, jika tidak fallback ke 'ollama' di PATH."""
    if OLLAMA_PATH and os.path.isfile(OLLAMA_PATH) and os.access(OLLAMA_PATH, os.X_OK):
        return OLLAMA_PATH
    return "ollama"


def analyze_with_local_ai(text: str) -> str:
    """
    Menganalisis teks menggunakan model AI lokal melalui Ollama.
    Berjalan sepenuhnya offline tanpa koneksi internet.

    Prerequisites:
    - Ollama harus terinstall (https://ollama.ai)
    - Model 'llama3' harus sudah didownload: `ollama pull llama3`

    Args:
        text: Teks yang akan dianalisis

    Returns:
        String berisi hasil analisis dari model AI lokal

    Raises:
        RuntimeError: Jika Ollama tidak terinstall atau model tidak tersedia
    """
    # Cek apakah Ollama terinstall (baik di OLLAMA_PATH atau di PATH)
    if not _check_ollama_installed():
        error_msg = (
            f"Ollama is not installed or not found at configured path: {OLLAMA_PATH}. "
            "Please install from https://ollama.ai and/or set OLLAMA_PATH correctly."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    try:
        # Format prompt dengan teks dokumen
        prompt = ANALYSIS_PROMPT.format(
            text=text[:4000]
        )  # Limit text untuk menghindari prompt terlalu panjang

        # Gunakan path ollama sesuai OLLAMA_PATH jika tersedia
        ollama_executable = _get_ollama_cmd()
        cmd = [ollama_executable, "run", "llama3", prompt]

        logger.info(
            f"Calling local Ollama model at '{ollama_executable}' for analysis..."
        )

        # Tampilkan hanya simbol loading sederhana selama proses analisis
        import sys

        loading_symbols = ["|", "/", "-", "\\"]

        def simple_loading(sec):
            symbol = loading_symbols[sec % len(loading_symbols)]
            sys.stdout.write(f"\rAnalyzing... {symbol}")
            sys.stdout.flush()

        def run_cmd():
            return subprocess.check_output(
                cmd,
                text=True,
                timeout=120,
                stderr=subprocess.PIPE,
                encoding="utf-8",
                errors="ignore",
            )

        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_cmd)
            sec = 0
            while not future.done() and sec < 120:
                time.sleep(1)
                simple_loading(sec)
                sec += 1
            sys.stdout.write("\r" + " " * 30 + "\r")  # clear line
            sys.stdout.flush()
            if not future.done():
                # forcibly cancel if timeout
                raise subprocess.TimeoutExpired(cmd, 120)
            output = future.result()

        result = output.strip()
        if not result:
            raise RuntimeError("Empty response from Ollama")

        logger.info("AI analysis completed successfully")
        return result

    except subprocess.TimeoutExpired:
        error_msg = (
            "AI analysis timed out. The model may be too slow or the text too long."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    except subprocess.CalledProcessError as e:
        error_msg = (
            f"Ollama command failed: {e.stderr.decode() if e.stderr else str(e)}"
        )
        logger.error(error_msg)
        # Check if model is missing
        if "model" in error_msg.lower() or "not found" in error_msg.lower():
            raise RuntimeError(
                "Model 'llama3' not found. Please run: ollama pull llama3"
            )
        raise RuntimeError(error_msg)
    except FileNotFoundError:
        error_msg = f"Ollama command not found. Please ensure Ollama is installed and in PATH or at '{OLLAMA_PATH}'."
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error in AI engine: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


CHAT_PROMPT = """You are a helpful assistant. Answer the user's question based on the provided document context.

Document context:
{document_context}

User question: {message}

Provide a helpful and accurate response based on the document context:"""


def chat_with_local_ai(message: str, document_context: str = "") -> str:
    if not _check_ollama_installed():
        error_msg = (
            f"Ollama is not installed or not found at configured path: {OLLAMA_PATH}. "
            "Please install from https://ollama.ai and/or set OLLAMA_PATH correctly."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    try:
        context_text = document_context[:4000] if document_context else "No document context provided."
        prompt = CHAT_PROMPT.format(
            message=message[:1000],
            document_context=context_text
        )

        ollama_executable = _get_ollama_cmd()
        cmd = [ollama_executable, "run", "llama3", prompt]

        logger.info(f"Calling local Ollama model for chat...")

        output = subprocess.check_output(
            cmd,
            text=True,
            timeout=120,
            stderr=subprocess.PIPE,
            encoding="utf-8",
            errors="ignore",
        )

        result = output.strip()
        if not result:
            raise RuntimeError("Empty response from Ollama")

        logger.info("AI chat completed successfully")
        return result

    except subprocess.TimeoutExpired:
        error_msg = "AI chat timed out. The model may be too slow."
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    except subprocess.CalledProcessError as e:
        error_msg = f"Ollama command failed: {e.stderr.decode() if e.stderr else str(e)}"
        logger.error(error_msg)
        if "model" in error_msg.lower() or "not found" in error_msg.lower():
            raise RuntimeError("Model 'llama3' not found. Please run: ollama pull llama3")
        raise RuntimeError(error_msg)
    except FileNotFoundError:
        error_msg = f"Ollama command not found. Please ensure Ollama is installed and in PATH or at '{OLLAMA_PATH}'."
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error in AI chat: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)