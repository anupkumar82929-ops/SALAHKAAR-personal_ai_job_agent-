from fastapi import APIRouter, Depends, HTTPException, Path

from app.ai.job_analysis import analyze_job
from app.api.auth import get_current_user


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


@router.get("/jobs/{job_id}/analysis")
def get_job_analysis(
    job_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    try:
        return analyze_job(
            user_id=current_user["id"],
            job_id=job_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )