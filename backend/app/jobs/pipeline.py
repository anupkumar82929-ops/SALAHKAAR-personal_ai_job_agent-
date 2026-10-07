from app.jobs.deduplicator import generate_job_key
from app.jobs.normalizer import normalize_job
from app.jobs.repository import save_job
from app.jobs.schemas import RawJob
from app.jobs.skill_extractor import extract_skills
from app.jobs.skill_repository import save_job_skills
from app.jobs.validator import validate_job


def process_job(job: RawJob) -> dict:
    normalized_job = normalize_job(job)

    validate_job(normalized_job)

    job_key = generate_job_key(normalized_job)

    saved_job = save_job(normalized_job)

    extracted_skills = extract_skills(
        normalized_job.description
    )

    skill_ids = save_job_skills(
        job_id=saved_job["id"],
        skill_names=extracted_skills,
    )

    return {
        "job": saved_job,
        "job_key": job_key,
        "skills": extracted_skills,
        "skill_ids": skill_ids,
    }