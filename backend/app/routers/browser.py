from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel
from app.services.browser_session import (
    create_session,
    get_session,
    close_session,
)
import asyncio
import base64
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class NavigateRequest(BaseModel):
    session_id: str
    url: str


class ClickRequest(BaseModel):
    session_id: str
    x: float
    y: float
    button: str = "left"


@router.post("/session/create")
async def create_browser_session():
    session_id = await create_session()
    return {"session_id": session_id}


@router.post("/session/close")
async def close_browser_session(session_id: str):
    await close_session(session_id)
    return {"success": True}


@router.post("/navigate")
async def navigate(req: NavigateRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        await session["page"].goto(req.url, wait_until="networkidle", timeout=30000)
        return {"success": True, "url": req.url}
    except Exception as e:
        logger.error(f"Navigate error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/stream/{session_id}")
async def websocket_stream(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = await get_session(session_id)
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    try:
        while True:
            screenshot = await session["page"].screenshot(type="png")
            base64_img = base64.b64encode(screenshot).decode("utf-8")
            await websocket.send_json({
                "type": "screenshot",
                "data": f"data:image/png;base64,{base64_img}"
            })
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Stream error: {str(e)}")
        await websocket.close(code=1011, reason=str(e))


@router.post("/click")
async def click(req: ClickRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        await session["page"].click(
            x=req.x,
            y=req.y,
            button=req.button
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Click error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/get-element-at-position")
async def get_element_at_position(
    session_id: str = Query(...), x: float = Query(...), y: float = Query(...)
):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        element_info = await session["page"].evaluate(f"""
            (() => {{
                const el = document.elementFromPoint({x}, {y});
                if (!el) return null;
                let selector = '';
                if (el.id) selector = '#' + el.id;
                else if (el.name) selector = '[name="' + el.name + '"]';
                else if (el.className && typeof el.className === 'string') {{
                    const classes = el.className.split(' ').filter(c => c).join('.');
                    if (classes) selector = '.' + classes;
                }}
                if (!selector) selector = el.tagName.toLowerCase();
                return {{
                    selector: selector,
                    tag: el.tagName.toLowerCase(),
                    type: el.type || '',
                    name: el.name || '',
                    id: el.id || '',
                    value: el.value || ''
                }};
            }})()
        """)
        return {"success": True, "element": element_info}
    except Exception as e:
        logger.error(f"Get element at position error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

