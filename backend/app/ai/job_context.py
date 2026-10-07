from app.database.connection import get_connection
from app.matching.service import calculate_job_match


def build_job_context(
    user_id: int,
    job_id: int,
) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    source,
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
                    expires_at
                FROM jobs
                WHERE id = %s;
                """,
                (job_id,),
            )

            job = cursor.fetchone()

    if job is None:
        raise ValueError("Job not found.")

    match = calculate_job_match(
        user_id=user_id,
        job_id=job_id,
    )

    return {
        "job": {
            "id": job[0],
            "source": job[1],
            "title": job[2],
            "company": job[3],
            "location": job[4],
            "work_mode": job[5],
            "employment_type": job[6],
            "experience_min": (
                float(job[7])
                if job[7] is not None
                else None
            ),
            "experience_max": (
                float(job[8])
                if job[8] is not None
                else None
            ),
            "salary_min": (
                float(job[9])
                if job[9] is not None
                else None
            ),
            "salary_max": (
                float(job[10])
                if job[10] is not None
                else None
            ),
            "salary_currency": job[11],
            "description": job[12],
            "application_url": job[13],
            "posted_at": job[14],
            "expires_at": job[15],
        },

        "match": match,
    }