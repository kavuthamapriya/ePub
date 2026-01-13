from pydantic import BaseModel

class FinalizeResponse(BaseModel):
    status: str
    download_url: str
