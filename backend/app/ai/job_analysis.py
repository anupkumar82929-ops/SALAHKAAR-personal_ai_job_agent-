from app.ai.job_context import build_job_context


def analyze_job(
    user_id: int,
    job_id: int,
) -> dict:
    context = build_job_context(
        user_id=user_id,
        job_id=job_id,
    )

    job = context["job"]
    match = context["match"]

    return {
        "job": {
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "work_mode": job["work_mode"],
            "employment_type": job["employment_type"],
            "application_url": job["application_url"],
        },
        "match": {
            "score": match["match_score"],
            "breakdown": match["breakdown"],
            "reasons": match["reasons"],
            "matching_skills": sorted(
                set(match["user_skills"])
                & set(match["job_skills"])
            ),
            "missing_skills": sorted(
                set(match["job_skills"])
                - set(match["user_skills"])
            ),
        },
    }