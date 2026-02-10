from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.epub import router as epub_router
from app.routes.convert import router as convert_router
from app.routes.qc import router as qc_router
from app.routes.preview import router as preview_router
from app.routes.pdf import router as pdf_router
from app.routes.epub2pdf import router as epub2pdf_router
from app.routes.epub2pdf_storage import router as epub2pdf_storage_router
from app.routes.auto_fix import router as auto_fix_router   # ✅ ADD THIS
from app.db import database

app = FastAPI(title="Accessible EPUB System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

app.include_router(epub_router, prefix="/api")
app.include_router(convert_router, prefix="/api")
app.include_router(qc_router, prefix="/api/qc")
app.include_router(preview_router, prefix="/api")
app.include_router(pdf_router, prefix="/api/pdf")
app.include_router(epub2pdf_router, prefix="/api/epub2pdf")
app.include_router(epub2pdf_storage_router, prefix="/api/epub2pdf_storage")
app.include_router(auto_fix_router, prefix="/api/auto_fix")   # ✅ ADD THIS

@app.get("/")
def root():
    return {"status": "backend running"}
