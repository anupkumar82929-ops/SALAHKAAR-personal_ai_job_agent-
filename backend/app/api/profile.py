from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


class ProfileRequest(BaseModel):
    headline: Optional[str] = Field(default=None, max_length=255)
    summary: Optional[str] = None
    years_of_experience: float = Field(default=0, ge=0, le=50)
    current_location: Optional[str] = Field(default=None, max_length=150)
    preferred_locations: Optional[str] = None
    preferred_work_mode: Optional[str] = Field(default=None, max_length=30)
    expected_salary_min: Optional[float] = Field(default=None, ge=0)
    expected_salary_max: Optional[float] = Field(default=None, ge=0)


@router.post("")
def create_profile(
    request: ProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    if (
        request.expected_salary_min is not None
        and request.expected_salary_max is not None
        and request.expected_salary_min > request.expected_salary_max
    ):
        raise HTTPException(
            status_code=400,
            detail="Minimum salary cannot be greater than maximum salary.",
        )

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM profiles
                    WHERE user_id = %s;
                    """,
                    (user_id,),
                )

                existing_profile = cursor.fetchone()

                if existing_profile is not None:
                    raise HTTPException(
                        status_code=409,
                        detail="Profile already exists.",
                    )

                cursor.execute(
                    """
                    INSERT INTO profiles
                    (
                        user_id,
                        headline,
                        summary,
                        years_of_experience,
                        current_location,
                        preferred_locations,
                        preferred_work_mode,
                        expected_salary_min,
                        expected_salary_max
                    )
                    VALUES
                    (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s
                    )
                    RETURNING
                        id,
                        user_id,
                        headline,
                        summary,
                        years_of_experience,
                        current_location,
                        preferred_locations,
                        preferred_work_mode,
                        expected_salary_min,
                        expected_salary_max,
                        created_at,
                        updated_at;
                    """,
                    (
                        user_id,
                        request.headline,
                        request.summary,
                        request.years_of_experience,
                        request.current_location,
                        request.preferred_locations,
                        request.preferred_work_mode,
                        request.expected_salary_min,
                        request.expected_salary_max,
                    ),
                )

                profile = cursor.fetchone()

        return {
            "message": "Profile created successfully.",
            "profile": {
                "id": profile[0],
                "user_id": profile[1],
                "headline": profile[2],
                "summary": profile[3],
                "years_of_experience": profile[4],
                "current_location": profile[5],
                "preferred_locations": profile[6],
                "preferred_work_mode": profile[7],
                "expected_salary_min": profile[8],
                "expected_salary_max": profile[9],
                "created_at": profile[10],
                "updated_at": profile[11],
            },
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to create profile.",
        )

@router.get("")
def get_profile(
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        user_id,
                        headline,
                        summary,
                        years_of_experience,
                        current_location,
                        preferred_locations,
                        preferred_work_mode,
                        expected_salary_min,
                        expected_salary_max,
                        created_at,
                        updated_at
                    FROM profiles
                    WHERE user_id = %s;
                    """,
                    (user_id,),
                )

                profile = cursor.fetchone()

        if profile is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found.",
            )

        return {
            "profile": {
                "id": profile[0],
                "user_id": profile[1],
                "headline": profile[2],
                "summary": profile[3],
                "years_of_experience": profile[4],
                "current_location": profile[5],
                "preferred_locations": profile[6],
                "preferred_work_mode": profile[7],
                "expected_salary_min": profile[8],
                "expected_salary_max": profile[9],
                "created_at": profile[10],
                "updated_at": profile[11],
            }
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve profile.",
        )

@router.put("")
def update_profile(
    request: ProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    if (
        request.expected_salary_min is not None
        and request.expected_salary_max is not None
        and request.expected_salary_min > request.expected_salary_max
    ):
        raise HTTPException(
            status_code=400,
            detail="Minimum salary cannot be greater than maximum salary.",
        )

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE profiles
                    SET
                        headline = %s,
                        summary = %s,
                        years_of_experience = %s,
                        current_location = %s,
                        preferred_locations = %s,
                        preferred_work_mode = %s,
                        expected_salary_min = %s,
                        expected_salary_max = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    RETURNING
                        id,
                        user_id,
                        headline,
                        summary,
                        years_of_experience,
                        current_location,
                        preferred_locations,
                        preferred_work_mode,
                        expected_salary_min,
                        expected_salary_max,
                        created_at,
                        updated_at;
                    """,
                    (
                        request.headline,
                        request.summary,
                        request.years_of_experience,
                        request.current_location,
                        request.preferred_locations,
                        request.preferred_work_mode,
                        request.expected_salary_min,
                        request.expected_salary_max,
                        user_id,
                    ),
                )

                profile = cursor.fetchone()

        if profile is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found.",
            )

        return {
            "message": "Profile updated successfully.",
            "profile": {
                "id": profile[0],
                "user_id": profile[1],
                "headline": profile[2],
                "summary": profile[3],
                "years_of_experience": profile[4],
                "current_location": profile[5],
                "preferred_locations": profile[6],
                "preferred_work_mode": profile[7],
                "expected_salary_min": profile[8],
                "expected_salary_max": profile[9],
                "created_at": profile[10],
                "updated_at": profile[11],
            },
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to update profile.",
        )