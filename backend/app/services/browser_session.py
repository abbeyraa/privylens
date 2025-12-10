import logging
import uuid
from typing import Dict, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright
import asyncio

logger = logging.getLogger(__name__)

_sessions: Dict[str, Dict] = {}
_playwright: Optional[Playwright] = None


async def get_playwright() -> Playwright:
    global _playwright
    if _playwright is None:
        _playwright = await async_playwright().start()
    return _playwright


async def create_session(session_id: Optional[str] = None) -> str:
    if session_id is None:
        session_id = str(uuid.uuid4())
    
    playwright = await get_playwright()
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(
        viewport={"width": 1280, "height": 720},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    page = await context.new_page()
    
    _sessions[session_id] = {
        "browser": browser,
        "context": context,
        "page": page,
        "playwright": playwright
    }
    
    return session_id


async def get_session(session_id: str) -> Optional[Dict]:
    return _sessions.get(session_id)


async def close_session(session_id: str):
    session = _sessions.get(session_id)
    if session:
        try:
            await session["context"].close()
            await session["browser"].close()
        except:
            pass
        del _sessions[session_id]


async def close_all_sessions():
    for session_id in list(_sessions.keys()):
        await close_session(session_id)
    global _playwright
    if _playwright:
        await _playwright.stop()
        _playwright = None

