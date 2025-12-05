from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import convert as convert_router
from app.routes import qc as qc_router  # 👈 new import


app = FastAPI(title="Accessible EPUB System API")  # 👈 app must be defined first


# Optional: CORS, keep or adjust as you already had it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 Routers are included *after* app is defined
app.include_router(convert_router.router, prefix="/convert", tags=["convert"])
app.include_router(qc_router.router, prefix="/qc", tags=["qc"])  # 👈 QC endpoint


@app.get("/health")
async def health():
    return {"status": "ok"}
