from pydantic import BaseModel


class IngestRequest(BaseModel):
    filename: str
