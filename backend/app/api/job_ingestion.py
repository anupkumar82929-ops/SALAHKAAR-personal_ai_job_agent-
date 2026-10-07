from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.auth import get_current_user
from app.jobs.ingestion import ingest_adzuna_jobs


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


class AdzunaIngestionRequest(BaseModel):
    what: str = Field(default="software engineer", min_length=2)
    where: str | None = None
    results_per_page: int = Field(default=20, ge=1, le=50)


@router.post("/ingest/adzuna")
def ingest_jobs_from_adzuna(
    request: AdzunaIngestionRequest,
    current_user: dict = Depends(get_current_user),
):
    return ingest_adzuna_jobs(
        what=request.what,
        where=request.where,
        results_per_page=request.results_per_page,
    )