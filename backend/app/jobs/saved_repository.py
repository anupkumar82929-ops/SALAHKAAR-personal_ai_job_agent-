from app.database.connection import get_connection


def save_job_for_user(user_id: int, job_id: int) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT id, title, company
                FROM jobs
                WHERE id = %s;
                """,
                (job_id,),
            )

            job = cursor.fetchone()

            if job is None:
                raise ValueError("Job not found.")

            cursor.execute(
                """
                INSERT INTO saved_jobs (
                    user_id,
                    job_id
                )
                VALUES (%s, %s)
                ON CONFLICT (user_id, job_id)
                DO NOTHING
                RETURNING id, user_id, job_id, created_at;
                """,
                (user_id, job_id),
            )

            saved = cursor.fetchone()

            if saved is None:
                cursor.execute(
                    """
                    SELECT id, user_id, job_id, created_at
                    FROM saved_jobs
                    WHERE user_id = %s
                    AND job_id = %s;
                    """,
                    (user_id, job_id),
                )

                saved = cursor.fetchone()

    return {
        "id": saved[0],
        "user_id": saved[1],
        "job_id": saved[2],
        "created_at": saved[3],
        "job": {
            "id": job[0],
            "title": job[1],
            "company": job[2],
        },
    }


def unsave_job_for_user(user_id: int, job_id: int) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM saved_jobs
                WHERE user_id = %s
                AND job_id = %s
                RETURNING id;
                """,
                (user_id, job_id),
            )

            deleted = cursor.fetchone()

    return deleted is not None


def get_saved_jobs(user_id: int) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    sj.id,
                    sj.job_id,
                    sj.created_at,
                    j.title,
                    j.company,
                    j.location,
                    j.work_mode,
                    j.application_url
                FROM saved_jobs sj
                JOIN jobs j
                    ON j.id = sj.job_id
                WHERE sj.user_id = %s
                ORDER BY sj.created_at DESC;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

    return [
        {
            "saved_job_id": row[0],
            "job_id": row[1],
            "saved_at": row[2],
            "title": row[3],
            "company": row[4],
            "location": row[5],
            "work_mode": row[6],
            "application_url": row[7],
        }
        for row in rows
    ]