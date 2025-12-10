from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.playwright_automation import run_automation
from app.services.html_form_parser import extract_form_inputs_from_html
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class AutomationMapping(BaseModel):
    selector: str
    variable: str


class AutomationOptions(BaseModel):
    post: bool = False


class AutomationRequest(BaseModel):
    url: str
    mappings: List[AutomationMapping]
    payload: Dict[str, Any]
    options: AutomationOptions | None = None
    wait_timeout: int = 30000


class HtmlFormRequest(BaseModel):
    html: str


@router.post("/run")
async def run_form_automation(req: AutomationRequest):
    """
    Menjalankan automation pengisian form menggunakan Playwright.
    """
    try:
        mappings = [{"selector": m.selector, "variable": m.variable} for m in req.mappings]
        options = req.options or AutomationOptions()
        result = await run_automation(
            url=req.url,
            mappings=mappings,
            payload=req.payload,
            handle_popup=options.post,
            wait_timeout=req.wait_timeout,
        )
        return result
    except Exception as e:
        logger.error(f"Automation endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-inputs")
async def extract_form_inputs(req: HtmlFormRequest):
    """
    Mengekstrak field input form dari HTML target yang di-paste user.
    """
    if not req.html.strip():
        raise HTTPException(status_code=400, detail="HTML cannot be empty")

    try:
        inputs = extract_form_inputs_from_html(req.html)
        return {
            "success": True,
            "total": len(inputs),
            "inputs": inputs,
        }
    except Exception as e:
        logger.error(f"HTML form extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

