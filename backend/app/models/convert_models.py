from pydantic import BaseModel
from typing import List


class AccessibleEPUB(BaseModel):
    accessible_html: str
    notes: List[str]
    percentage: float


class ConvertResponse(BaseModel):
    accessible: AccessibleEPUB
