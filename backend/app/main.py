from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import convert, qc, suggest

app = FastAPI(title="Accessible EPUB Converter – Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(convert.router, prefix="/convert", tags=["Convert"])
app.include_router(qc.router, prefix="/qc", tags=["QC"])
app.include_router(suggest.router, prefix="/suggest", tags=["Suggest"])


@app.get("/")
def home():
    return {"status": "Backend OK"}
