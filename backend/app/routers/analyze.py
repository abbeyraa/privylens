from fastapi import APIRouter, HTTPException
from app.models.analyze_request import AnalyzeRequest
from app.services.ai_engine import analyze_with_local_ai

router = APIRouter()


@router.post("/")
def analyze(req: AnalyzeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        raw = analyze_with_local_ai(req.text)

        if not raw or raw.startswith("AI engine failed"):
            raise HTTPException(
                status_code=500,
                detail="AI engine failed. Ensure Ollama and model are running.",
            )

        # --- FORMATTING DI BACKEND ---
        summary = raw.split(".")[0].strip() + "."
        key_findings = [
            sentence.strip() + "." for sentence in raw.split(".") if sentence.strip()
        ][:3]

        response = {
            "success": True,
            "ok": 200,
            "raw": raw,
            "summary": summary,
            "key_findings": key_findings,
            "tags": ["AI", "Document Analysis"],
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
