from app.jobs.schemas import RawJob


def normalize_job(job: RawJob) -> RawJob:
    """
    Normalize a RawJob before it is stored or processed.

    This function intentionally does not change the meaning
    of the job. It only cleans formatting and standardizes
    common fields.
    """

    title = job.title.strip()
    company = job.company.strip()

    location = (
        job.location.strip()
        if job.location
        else None
    )

    work_mode = (
        job.work_mode.strip().lower()
        if job.work_mode
        else None
    )

    employment_type = (
        job.employment_type.strip().lower()
        if job.employment_type
        else None
    )

    description = job.description.strip()

    application_url = job.application_url.strip()

    external_id = (
        job.external_id.strip()
        if job.external_id
        else None
    )

    salary_currency = (
        job.salary_currency.strip().upper()
        if job.salary_currency
        else None
    )

    return RawJob(
        source=job.source.strip(),
        external_id=external_id,
        title=title,
        company=company,
        location=location,
        work_mode=work_mode,
        employment_type=employment_type,
        experience_min=job.experience_min,
        experience_max=job.experience_max,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=salary_currency,
        description=description,
        application_url=application_url,
        posted_at=job.posted_at,
        expires_at=job.expires_at,
    )