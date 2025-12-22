from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.convert import router as convert_router

from app.routes.epub import router as epub_router
from app.routes.qc import router as qc_router 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ routers
app.include_router(epub_router, prefix="/api")
app.include_router(qc_router, prefix="/api/qc")   
app.include_router(convert_router,prefix="/api")

@app.get("/")
def root():
    return {"status": "backend running"}
