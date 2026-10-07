from fastapi import APIRouter, Depends, HTTPException, Path

from app.api.auth import get_current_user
from app.jobs.saved_repository import (
    get_saved_jobs,
    save_job_for_user,
    unsave_job_for_user,
)


router = APIRouter(
    prefix="/api/saved-jobs",
    tags=["Saved Jobs"],
)


@router.post("/{job_id}")
def save_job(
    job_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    try:
        return save_job_for_user(
            user_id=current_user["id"],
            job_id=job_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


@router.delete("/{job_id}")
def unsave_job(
    job_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    deleted = unsave_job_for_user(
        user_id=current_user["id"],
        job_id=job_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Saved job not found.",
        )

    return {
        "message": "Job removed from saved jobs."
    }


@router.get("")
def list_saved_jobs(
    current_user: dict = Depends(get_current_user),
):
    jobs = get_saved_jobs(
        user_id=current_user["id"],
    )

    return {
        "count": len(jobs),
        "saved_jobs": jobs,
    }