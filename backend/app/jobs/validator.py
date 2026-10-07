from urllib.parse import urlparse

from app.jobs.schemas import RawJob


class JobValidationError(ValueError):
    """Raised when a job does not contain valid required data."""


def validate_job(job: RawJob) -> None:
    """
    Validate a normalized job before persistence.

    Raises:
        JobValidationError: if required job data is invalid.
    """

    if not job.source or not job.source.strip():
        raise JobValidationError(
            "Job source is required."
        )

    if not job.title or not job.title.strip():
        raise JobValidationError(
            "Job title is required."
        )

    if not job.company or not job.company.strip():
        raise JobValidationError(
            "Company name is required."
        )

    if not job.description or not job.description.strip():
        raise JobValidationError(
            "Job description is required."
        )

    if not job.application_url or not job.application_url.strip():
        raise JobValidationError(
            "Application URL is required."
        )

    parsed_url = urlparse(job.application_url)

    if parsed_url.scheme not in {"http", "https"}:
        raise JobValidationError(
            "Application URL must use HTTP or HTTPS."
        )

    if not parsed_url.netloc:
        raise JobValidationError(
            "Application URL is invalid."
        )

    if job.experience_min is not None and job.experience_min < 0:
        raise JobValidationError(
            "Minimum experience cannot be negative."
        )

    if job.experience_max is not None and job.experience_max < 0:
        raise JobValidationError(
            "Maximum experience cannot be negative."
        )

    if (
        job.experience_min is not None
        and job.experience_max is not None
        and job.experience_min > job.experience_max
    ):
        raise JobValidationError(
            "Minimum experience cannot exceed maximum experience."
        )

    if job.salary_min is not None and job.salary_min < 0:
        raise JobValidationError(
            "Minimum salary cannot be negative."
        )

    if job.salary_max is not None and job.salary_max < 0:
        raise JobValidationError(
            "Maximum salary cannot be negative."
        )

    if (
        job.salary_min is not None
        and job.salary_max is not None
        and job.salary_min > job.salary_max
    ):
        raise JobValidationError(
            "Minimum salary cannot exceed maximum salary."
        )