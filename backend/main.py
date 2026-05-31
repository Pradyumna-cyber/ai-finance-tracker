from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.finance_routes import router

app = FastAPI(
    title="AI Finance Tracker API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "AI Finance Tracker Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
