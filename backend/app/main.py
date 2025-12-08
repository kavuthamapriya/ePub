from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import convert as convert_router
from app.routes import qc as qc_router
from app.routes import pdf as pdf_router

app = FastAPI(title="Accessible EPUB System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(convert_router.router, prefix="/api", tags=["convert"])
app.include_router(qc_router.router, prefix="/api/qc", tags=["qc"])
app.include_router(pdf_router.router, prefix="/api/pdf", tags=["pdf"])
