from pydantic import BaseModel
from typing import List


class QCReport(BaseModel):
    status: str
    errors: List[str]
    warnings: List[str]
