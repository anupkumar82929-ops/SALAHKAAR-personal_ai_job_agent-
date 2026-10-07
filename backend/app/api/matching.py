from fastapi import APIRouter, Depends, HTTPException, Path

from app.api.auth import get_current_user
from app.matching.service import calculate_job_match


router = APIRouter(
    prefix="/api/matching",
    tags=["Matching"],
)


@router.get("/jobs/{job_id}")
def get_job_match(
    job_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    try:
        return calculate_job_match(
            user_id=current_user["id"],
            job_id=job_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )