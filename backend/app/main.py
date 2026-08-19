from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.github import router as github_router
from app.api.review import router as review_router
from app.api.prediction import router as prediction_router

load_dotenv()

app = FastAPI(
    title="AI Reviewer",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(github_router)
app.include_router(review_router)
app.include_router(prediction_router)


@app.get("/")
async def root():
    return {
        "message": "AI Reviewer Backend Running"
    }
