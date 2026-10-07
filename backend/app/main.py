from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.jobs import router as jobs_router

from app.api.skills import router as skills_router
from app.api.auth import router as auth_router
from app.database.connection import get_connection
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.job_ingestion import router as job_ingestion_router
from app.api.matching import router as matching_router
from app.api.recommendations import router as recommendations_router
from app.api.saved_jobs import router as saved_jobs_router
from app.api.applications import router as applications_router
from app.api.ai_conversations import router as ai_conversations_router
from app.ai.ai_chat import router as ai_chat_router
from app.api.ai_job_chat import router as ai_job_chat_router
from app.api.job_analysis import router as job_analysis_router

app = FastAPI(
    title="Personal AI Job Agent",
    description="Personalized AI-powered job search assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(skills_router)
app.include_router(resume_router)
app.include_router(job_ingestion_router)
app.include_router(matching_router)
app.include_router(recommendations_router)
app.include_router(saved_jobs_router)
app.include_router(applications_router)
app.include_router(ai_conversations_router)
app.include_router(ai_chat_router)
app.include_router(ai_job_chat_router)
app.include_router(job_analysis_router)

@app.get("/")
def root():
    return {
        "message": "Personal AI Job Agent API",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():

    try:
        connection = get_connection()
        connection.close()

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error),
        }