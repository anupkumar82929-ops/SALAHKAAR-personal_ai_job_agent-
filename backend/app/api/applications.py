from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from app.api.auth import get_current_user
from app.jobs.application_repository import (
    create_application,
    get_user_applications,
    update_application_status,
)


router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"],
)


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)


@router.post("/{job_id}")
def create_job_application(
    job_id: int = Path(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    try:
        return create_application(
            user_id=current_user["id"],
            job_id=job_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


@router.patch("/{application_id}/status")
def update_status(
    application_id: int,
    request: ApplicationStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        return update_application_status(
            user_id=current_user["id"],
            application_id=application_id,
            status=request.status,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("")
def list_applications(
    current_user: dict = Depends(get_current_user),
):
    applications = get_user_applications(
        user_id=current_user["id"],
    )

    return {
        "count": len(applications),
        "applications": applications,
    }