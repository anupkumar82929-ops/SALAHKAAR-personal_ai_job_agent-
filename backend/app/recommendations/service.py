from app.database.connection import get_connection
from app.matching.service import calculate_job_match


def get_recommendations(
    user_id: int,
    limit: int = 10,
) -> list[dict]:
    """
    Generate personalized job recommendations for a user.

    Flow:
    1. Fetch available jobs.
    2. Calculate match score for every job.
    3. Sort jobs by highest match score.
    4. Return the best matching jobs.
    """

    # ---------------------------------------------------------
    # Validate limit
    # ---------------------------------------------------------

    if limit < 1:
        limit = 1

    if limit > 50:
        limit = 50

    # ---------------------------------------------------------
    # Get jobs
    #
    # We fetch more jobs than the requested limit because
    # some jobs may fail matching or may have incomplete data.
    # ---------------------------------------------------------

    fetch_limit = max(limit * 3, 30)

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    source,
                    external_id,
                    title,
                    company,
                    location,
                    work_mode,
                    employment_type,
                    experience_min,
                    experience_max,
                    salary_min,
                    salary_max,
                    salary_currency,
                    description,
                    application_url,
                    posted_at,
                    expires_at,
                    created_at,
                    updated_at
                FROM jobs
                ORDER BY
                    posted_at DESC NULLS LAST,
                    created_at DESC
                LIMIT %s;
                """,
                (fetch_limit,),
            )

            rows = cursor.fetchall()

    # ---------------------------------------------------------
    # Calculate recommendations
    # ---------------------------------------------------------

    recommendations = []

    for row in rows:

        job_id = row[0]

        try:

            match = calculate_job_match(
                user_id=user_id,
                job_id=job_id,
            )

        except (ValueError, TypeError, KeyError):
            # One bad job should not break the complete
            # recommendation system.
            continue

        # -----------------------------------------------------
        # Build complete recommendation object
        # -----------------------------------------------------

        recommendation = {
            "job": {
                "id": row[0],
                "source": row[1],
                "external_id": row[2],
                "title": row[3],
                "company": row[4],
                "location": row[5],
                "work_mode": row[6],
                "employment_type": row[7],

                "experience_min": (
                    float(row[8])
                    if row[8] is not None
                    else None
                ),

                "experience_max": (
                    float(row[9])
                    if row[9] is not None
                    else None
                ),

                "salary_min": (
                    float(row[10])
                    if row[10] is not None
                    else None
                ),

                "salary_max": (
                    float(row[11])
                    if row[11] is not None
                    else None
                ),

                "salary_currency": row[12],
                "description": row[13],
                "application_url": row[14],
                "posted_at": row[15],
                "expires_at": row[16],
                "created_at": row[17],
                "updated_at": row[18],
            },

            "match": {
                "score": match.get("match_score", 0),

                "breakdown": match.get(
                    "breakdown",
                    {}
                ),

                "reasons": match.get(
                    "reasons",
                    []
                ),

                "user_skills": match.get(
                    "user_skills",
                    []
                ),

                "job_skills": match.get(
                    "job_skills",
                    []
                ),
            },
        }

        # -----------------------------------------------------
        # Matching skills
        # -----------------------------------------------------

        user_skills = set(
            match.get("user_skills", [])
        )

        job_skills = set(
            match.get("job_skills", [])
        )

        matching_skills = sorted(
            user_skills & job_skills
        )

        missing_skills = sorted(
            job_skills - user_skills
        )

        recommendation["match"][
            "matching_skills"
        ] = matching_skills

        recommendation["match"][
            "missing_skills"
        ] = missing_skills

        # -----------------------------------------------------
        # Add recommendation
        # -----------------------------------------------------

        recommendations.append(
            recommendation
        )

    # ---------------------------------------------------------
    # Sort by AI match score
    # ---------------------------------------------------------

    recommendations.sort(
        key=lambda item: item["match"]["score"],
        reverse=True,
    )

    # ---------------------------------------------------------
    # Return only requested number
    # ---------------------------------------------------------

    return recommendations[:limit]