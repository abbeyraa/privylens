from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_engine import chat_with_local_ai
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    document_context: Optional[str] = None


@router.post("/")
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response = chat_with_local_ai(req.message, req.document_context or "")
        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

