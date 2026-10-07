from app.database.connection import get_connection


VALID_STATUSES = {
    "saved",
    "applied",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
}


def create_application(
    user_id: int,
    job_id: int,
) -> dict:

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
                INSERT INTO applications (
                    user_id,
                    job_id,
                    status
                )
                VALUES (%s, %s, 'saved')
                ON CONFLICT (user_id, job_id)
                DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
                RETURNING
                    id,
                    user_id,
                    job_id,
                    status,
                    applied_at,
                    interview_at,
                    offer_at,
                    rejected_at,
                    notes,
                    created_at,
                    updated_at;
                """,
                (user_id, job_id),
            )

            application = cursor.fetchone()

    return {
        "id": application[0],
        "user_id": application[1],
        "job_id": application[2],
        "status": application[3],
        "applied_at": application[4],
        "interview_at": application[5],
        "offer_at": application[6],
        "rejected_at": application[7],
        "notes": application[8],
        "created_at": application[9],
        "updated_at": application[10],
        "job": {
            "id": job[0],
            "title": job[1],
            "company": job[2],
        },
    }


def update_application_status(
    user_id: int,
    application_id: int,
    status: str,
) -> dict:

    status = status.strip().lower()

    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid application status: {status}"
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE applications
                SET
                    status = %s,
                    applied_at = CASE
                        WHEN %s = 'applied'
                             AND applied_at IS NULL
                        THEN CURRENT_TIMESTAMP
                        ELSE applied_at
                    END,
                    interview_at = CASE
                        WHEN %s = 'interview'
                             AND interview_at IS NULL
                        THEN CURRENT_TIMESTAMP
                        ELSE interview_at
                    END,
                    offer_at = CASE
                        WHEN %s = 'offer'
                             AND offer_at IS NULL
                        THEN CURRENT_TIMESTAMP
                        ELSE offer_at
                    END,
                    rejected_at = CASE
                        WHEN %s = 'rejected'
                             AND rejected_at IS NULL
                        THEN CURRENT_TIMESTAMP
                        ELSE rejected_at
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                AND user_id = %s
                RETURNING
                    id,
                    job_id,
                    status,
                    applied_at,
                    interview_at,
                    offer_at,
                    rejected_at,
                    notes,
                    updated_at;
                """,
                (
                    status,
                    status,
                    status,
                    status,
                    status,
                    application_id,
                    user_id,
                ),
            )

            application = cursor.fetchone()

    if application is None:
        raise ValueError("Application not found.")

    return {
        "id": application[0],
        "job_id": application[1],
        "status": application[2],
        "applied_at": application[3],
        "interview_at": application[4],
        "offer_at": application[5],
        "rejected_at": application[6],
        "notes": application[7],
        "updated_at": application[8],
    }


def get_user_applications(user_id: int) -> list[dict]:

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    a.id,
                    a.job_id,
                    a.status,
                    a.applied_at,
                    a.interview_at,
                    a.offer_at,
                    a.rejected_at,
                    a.notes,
                    a.created_at,
                    a.updated_at,
                    j.title,
                    j.company,
                    j.location,
                    j.application_url
                FROM applications a
                JOIN jobs j
                    ON j.id = a.job_id
                WHERE a.user_id = %s
                ORDER BY a.updated_at DESC;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "job_id": row[1],
            "status": row[2],
            "applied_at": row[3],
            "interview_at": row[4],
            "offer_at": row[5],
            "rejected_at": row[6],
            "notes": row[7],
            "created_at": row[8],
            "updated_at": row[9],
            "job": {
                "title": row[10],
                "company": row[11],
                "location": row[12],
                "application_url": row[13],
            },
        }
        for row in rows
    ]