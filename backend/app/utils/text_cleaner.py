import re


def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\r", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()
    return text
