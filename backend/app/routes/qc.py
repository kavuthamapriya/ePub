from fastapi import APIRouter
from pydantic import BaseModel
from app.services.qc_service import run_qc
from app.models.qc_models import QCReport

router = APIRouter()


class QCRequest(BaseModel):
    html: str


@router.post("", response_model=QCReport)
def qc(req: QCRequest):
    return run_qc(req.html)
