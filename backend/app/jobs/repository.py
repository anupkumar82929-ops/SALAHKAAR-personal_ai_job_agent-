from app.database.connection import get_connection
from app.jobs.deduplicator import generate_job_key
from app.jobs.schemas import RawJob


def save_job(job: RawJob) -> dict:
    deduplication_key = generate_job_key(job)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO jobs
                (
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
                    deduplication_key
                )
                VALUES
                (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
                ON CONFLICT (deduplication_key)
                DO UPDATE SET
                    external_id = EXCLUDED.external_id,
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    location = EXCLUDED.location,
                    work_mode = EXCLUDED.work_mode,
                    employment_type = EXCLUDED.employment_type,
                    experience_min = EXCLUDED.experience_min,
                    experience_max = EXCLUDED.experience_max,
                    salary_min = EXCLUDED.salary_min,
                    salary_max = EXCLUDED.salary_max,
                    salary_currency = EXCLUDED.salary_currency,
                    description = EXCLUDED.description,
                    application_url = EXCLUDED.application_url,
                    posted_at = EXCLUDED.posted_at,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING
                    id,
                    source,
                    external_id,
                    title,
                    company,
                    application_url;
                """,
                (
                    job.source,
                    job.external_id,
                    job.title,
                    job.company,
                    job.location,
                    job.work_mode,
                    job.employment_type,
                    job.experience_min,
                    job.experience_max,
                    job.salary_min,
                    job.salary_max,
                    job.salary_currency,
                    job.description,
                    job.application_url,
                    job.posted_at,
                    job.expires_at,
                    deduplication_key,
                ),
            )

            record = cursor.fetchone()

    return {
        "id": record[0],
        "source": record[1],
        "external_id": record[2],
        "title": record[3],
        "company": record[4],
        "application_url": record[5],
    }