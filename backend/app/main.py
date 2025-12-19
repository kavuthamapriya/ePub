from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.epub import router as epub_router

app = FastAPI()

# CORS (required for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ IMPORTANT: router prefix
app.include_router(epub_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "backend running"}
