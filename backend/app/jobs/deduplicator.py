import hashlib

from app.jobs.schemas import RawJob


def normalize_identifier(value: str | None) -> str:
    if not value:
        return ""

    return " ".join(value.strip().lower().split())


def generate_job_key(job: RawJob) -> str:
    """
    Generate a deterministic key for identifying a job.

    Preferred:
        source + external_id

    Fallback:
        source + company + title + application_url
    """

    source = normalize_identifier(job.source)
    external_id = normalize_identifier(job.external_id)

    if source and external_id:
        raw_key = f"{source}|{external_id}"

    else:
        company = normalize_identifier(job.company)
        title = normalize_identifier(job.title)
        application_url = normalize_identifier(
            job.application_url
        )

        raw_key = (
            f"{source}|"
            f"{company}|"
            f"{title}|"
            f"{application_url}"
        )

    return hashlib.sha256(
        raw_key.encode("utf-8")
    ).hexdigest()