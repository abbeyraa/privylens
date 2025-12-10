import logging
from typing import Any, Dict, List

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


def _get_label_text(element) -> str:
    if not element:
        return ""

    # Label with for attribute
    element_id = element.get("id")
    if element_id:
        label = element.find_parent("form")
        if label:
            label = label.find("label", attrs={"for": element_id})
            if label and label.get_text(strip=True):
                return label.get_text(strip=True)

    # Parent label wrapper
    parent_label = element.find_parent("label")
    if parent_label and parent_label.get_text(strip=True):
        return parent_label.get_text(strip=True)

    return ""


def _build_selector(tag: str, attrs: Dict[str, Any]) -> str:
    element_id = attrs.get("id")
    name = attrs.get("name")
    classes = attrs.get("class") or []

    if element_id:
        return f"#{element_id}"
    if name:
        return f'[name="{name}"]'
    if classes:
        class_selector = ".".join(c for c in classes if c)
        if class_selector:
            return f"{tag}.{class_selector}"
    return tag


def extract_form_inputs_from_html(html: str) -> List[Dict[str, Any]]:
    """
    Mengekstrak input form dari HTML yang di-paste user.
    Mengembalikan daftar field dengan info dasar dan selector yang disarankan.
    """
    if not html:
        return []

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as e:
        logger.error(f"Failed to parse HTML: {str(e)}")
        return []

    inputs: List[Dict[str, Any]] = []

    # Prioritaskan elemen di dalam <form>, fallback ke seluruh dokumen
    form_elements = soup.find_all("form")
    search_root = form_elements or [soup]

    for root in search_root:
        for element in root.find_all(["input", "select", "textarea"]):
            tag = element.name.lower()

            input_type = (element.get("type") or "").lower()
            if tag == "input" and input_type in {
                "hidden",
                "submit",
                "button",
                "image",
                "reset",
            }:
                continue

            attrs = element.attrs
            name = attrs.get("name") or ""
            element_id = attrs.get("id") or ""
            placeholder = attrs.get("placeholder") or ""
            label = _get_label_text(element)
            selector = _build_selector(tag, attrs)

            key = name or element_id or selector
            if not key:
                continue

            inputs.append(
                {
                    "key": key,
                    "tag": tag,
                    "type": input_type if tag == "input" else tag,
                    "name": name,
                    "id": element_id,
                    "placeholder": placeholder,
                    "label": label,
                    "selector": selector,
                }
            )

    # Hilangkan duplikat berdasarkan selector
    unique: Dict[str, Dict[str, Any]] = {}
    for field in inputs:
        sel = field["selector"]
        if sel not in unique:
            unique[sel] = field

    return list(unique.values())


