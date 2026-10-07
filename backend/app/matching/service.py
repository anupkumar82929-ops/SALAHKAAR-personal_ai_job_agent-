from app.matching.reasons import generate_match_reasons
from app.database.connection import get_connection

from app.matching.scorer import (
    calculate_experience_match,
    calculate_location_match,
    calculate_match_score,
    calculate_skill_match,
    calculate_work_mode_match,
)


def calculate_job_match(
    user_id: int,
    job_id: int,
) -> dict:
    """
    Calculate how well a job matches a user's profile.

    Matching factors:
    1. Skills
    2. Experience
    3. Location
    4. Work mode

    The function is intentionally tolerant of a missing profile.
    If the profile does not exist, sensible default values are used
    instead of crashing with 'User profile not found'.
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:

            # ==========================================================
            # 1. GET USER PROFILE
            # ==========================================================

            cursor.execute(
                """
                SELECT
                    current_location,
                    preferred_locations,
                    preferred_work_mode,
                    years_of_experience
                FROM profiles
                WHERE user_id = %s;
                """,
                (user_id,),
            )

            profile = cursor.fetchone()

            # ----------------------------------------------------------
            # If profile doesn't exist, use default values.
            # This allows matching to continue using the user's skills.
            # ----------------------------------------------------------

            if profile is None:
                current_location = None
                preferred_locations = None
                preferred_work_mode = "Any"
                years_of_experience = 0

            else:
                current_location = profile[0]
                preferred_locations = profile[1]
                preferred_work_mode = profile[2] or "Any"
                years_of_experience = profile[3] or 0

            # ==========================================================
            # 2. GET USER SKILLS
            # ==========================================================

            cursor.execute(
                """
                SELECT LOWER(s.name)
                FROM user_skills us
                JOIN skills s
                    ON s.id = us.skill_id
                WHERE us.user_id = %s;
                """,
                (user_id,),
            )

            user_skills = {
                row[0].strip()
                for row in cursor.fetchall()
                if row[0]
            }

            # ==========================================================
            # 3. GET JOB
            # ==========================================================

            cursor.execute(
                """
                SELECT
                    id,
                    title,
                    company,
                    location,
                    work_mode,
                    experience_min,
                    experience_max
                FROM jobs
                WHERE id = %s;
                """,
                (job_id,),
            )

            job = cursor.fetchone()

            if job is None:
                raise ValueError(
                    f"Job not found for job_id={job_id}"
                )

            # ==========================================================
            # 4. GET JOB SKILLS
            # ==========================================================

            cursor.execute(
                """
                SELECT LOWER(s.name)
                FROM job_skills js
                JOIN skills s
                    ON s.id = js.skill_id
                WHERE js.job_id = %s;
                """,
                (job_id,),
            )

            job_skills = {
                row[0].strip()
                for row in cursor.fetchall()
                if row[0]
            }

    # ==============================================================
    # 5. SKILL MATCH
    # ==============================================================

    skill_match = calculate_skill_match(
        user_skills=user_skills,
        job_skills=job_skills,
    )

    # ==============================================================
    # 6. EXPERIENCE MATCH
    # ==============================================================

    experience_match = calculate_experience_match(
        user_experience=float(years_of_experience or 0),

        job_min_experience=(
            float(job[5])
            if job[5] is not None
            else None
        ),

        job_max_experience=(
            float(job[6])
            if job[6] is not None
            else None
        ),
    )

    # ==============================================================
    # 7. LOCATION MATCH
    # ==============================================================

    location_match = calculate_location_match(
        user_location=current_location,
        preferred_locations=preferred_locations,
        job_location=job[3],
    )

    # ==============================================================
    # 8. WORK MODE MATCH
    # ==============================================================

    work_mode_match = calculate_work_mode_match(
        preferred_work_mode=preferred_work_mode,
        job_work_mode=job[4],
    )

    # ==============================================================
    # 9. OVERALL MATCH SCORE
    # ==============================================================

    overall_score = calculate_match_score(
        skill_match=skill_match,
        experience_match=experience_match,
        location_match=location_match,
        work_mode_match=work_mode_match,
    )

    # ==============================================================
    # 10. MATCH REASONS
    # ==============================================================

    reasons = generate_match_reasons(
        user_skills=user_skills,
        job_skills=job_skills,
        skill_match=skill_match,
        experience_match=experience_match,
        location_match=location_match,
        work_mode_match=work_mode_match,
    )

    # ==============================================================
    # 11. RETURN COMPLETE RESULT
    # ==============================================================

    return {
        "job_id": job[0],

        "title": job[1],

        "company": job[2],

        "match_score": overall_score,

        "breakdown": {
            "skill_match": skill_match,
            "experience_match": experience_match,
            "location_match": location_match,
            "work_mode_match": work_mode_match,
        },

        "reasons": reasons,

        "user_skills": sorted(user_skills),

        "job_skills": sorted(job_skills),

        # Useful for debugging/frontend
        "profile": {
            "current_location": current_location,
            "preferred_locations": preferred_locations,
            "preferred_work_mode": preferred_work_mode,
            "years_of_experience": float(
                years_of_experience or 0
            ),
            "profile_exists": profile is not None,
        },
    }