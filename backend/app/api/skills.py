from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/skills",
    tags=["Skills"],
)


class SkillCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


@router.post("")
def create_skill(request: SkillCreateRequest):

    skill_name = request.name.strip()

    if not skill_name:
        raise HTTPException(
            status_code=400,
            detail="Skill name cannot be empty.",
        )

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO skills (name)
                    VALUES (%s)
                    ON CONFLICT (name)
                    DO UPDATE SET name = EXCLUDED.name
                    RETURNING id, name, created_at;
                    """,
                    (skill_name,),
                )

                skill = cursor.fetchone()

        return {
            "message": "Skill created successfully.",
            "skill": {
                "id": skill[0],
                "name": skill[1],
                "created_at": skill[2],
            },
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to create skill.",
        )


@router.get("")
def get_skills():

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id, name, created_at
                    FROM skills
                    ORDER BY name ASC;
                    """
                )

                skills = cursor.fetchall()

        return {
            "skills": [
                {
                    "id": skill[0],
                    "name": skill[1],
                    "created_at": skill[2],
                }
                for skill in skills
            ]
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve skills.",
        )

class UserSkillRequest(BaseModel):
    skill_id: int = Field(gt=0)
    proficiency: str | None = Field(default=None, max_length=30)


@router.post("/me")
def add_user_skill(
    request: UserSkillRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                # Check that the skill exists
                cursor.execute(
                    """
                    SELECT id, name
                    FROM skills
                    WHERE id = %s;
                    """,
                    (request.skill_id,),
                )

                skill = cursor.fetchone()

                if skill is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Skill not found.",
                    )

                # Add skill to the current user
                cursor.execute(
                    """
                    INSERT INTO user_skills
                    (
                        user_id,
                        skill_id,
                        proficiency
                    )
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, skill_id)
                    DO UPDATE SET proficiency = EXCLUDED.proficiency
                    RETURNING user_id, skill_id, proficiency, created_at;
                    """,
                    (
                        user_id,
                        request.skill_id,
                        request.proficiency,
                    ),
                )

                user_skill = cursor.fetchone()

        return {
            "message": "Skill added to user successfully.",
            "skill": {
                "user_id": user_skill[0],
                "skill_id": user_skill[1],
                "skill_name": skill[1],
                "proficiency": user_skill[2],
                "created_at": user_skill[3],
            },
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to add skill to user.",
        )


@router.get("/me")
def get_user_skills(
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        s.id,
                        s.name,
                        us.proficiency,
                        us.created_at
                    FROM user_skills us
                    JOIN skills s
                        ON s.id = us.skill_id
                    WHERE us.user_id = %s
                    ORDER BY s.name ASC;
                    """,
                    (user_id,),
                )

                skills = cursor.fetchall()

        return {
            "skills": [
                {
                    "id": skill[0],
                    "name": skill[1],
                    "proficiency": skill[2],
                    "created_at": skill[3],
                }
                for skill in skills
            ]
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve user skills.",
        )


@router.delete("/me/{skill_id}")
def remove_user_skill(
    skill_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM user_skills
                    WHERE user_id = %s
                    AND skill_id = %s
                    RETURNING user_id, skill_id;
                    """,
                    (user_id, skill_id),
                )

                deleted_skill = cursor.fetchone()

        if deleted_skill is None:
            raise HTTPException(
                status_code=404,
                detail="User skill not found.",
            )

        return {
            "message": "Skill removed successfully.",
            "user_id": deleted_skill[0],
            "skill_id": deleted_skill[1],
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to remove skill.",
        )