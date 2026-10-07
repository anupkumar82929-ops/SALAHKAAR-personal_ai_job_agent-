from app.jobs.pipeline import process_job
from app.jobs.sources.adzuna import AdzunaSource


def ingest_adzuna_jobs(
    what: str = "software engineer",
    where: str | None = None,
    results_per_page: int = 20,
) -> dict:

    source = AdzunaSource()

    jobs = source.fetch_jobs(
        what=what,
        where=where,
        results_per_page=results_per_page,
    )

    processed = 0
    failed = 0
    errors = []

    for job in jobs:
        try:
            process_job(job)
            processed += 1

        except Exception as error:
            failed += 1
            errors.append(
                {
                    "title": job.title,
                    "company": job.company,
                    "error": str(error),
                }
            )

    return {
        "source": source.name,
        "fetched": len(jobs),
        "processed": processed,
        "failed": failed,
        "errors": errors,
    }