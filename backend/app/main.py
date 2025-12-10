from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest, chat, variables, automation, browser
import logging
import atexit

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="Local Document Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/ingest", tags=["Ingestion"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(variables.router, prefix="/variables", tags=["Variables"])
app.include_router(automation.router, prefix="/automation", tags=["Automation"])
app.include_router(browser.router, prefix="/browser", tags=["Browser"])


@atexit.register
def cleanup():
    import asyncio
    from app.services.browser_session import close_all_sessions

    try:
        asyncio.run(close_all_sessions())
    except:
        pass


@app.get("/")
def root():
    return {"status": "FastAPI backend running offline"}
