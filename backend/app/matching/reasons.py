def generate_match_reasons(
    user_skills: set[str],
    job_skills: set[str],
    skill_match: float,
    experience_match: float,
    location_match: float,
    work_mode_match: float,
) -> list[str]:

    reasons = []

    matched_skills = sorted(
        user_skills & job_skills
    )

    missing_skills = sorted(
        job_skills - user_skills
    )

    if matched_skills:
        reasons.append(
            "Matching skills: "
            + ", ".join(matched_skills)
        )

    if missing_skills:
        reasons.append(
            "Skills not found in your profile: "
            + ", ".join(missing_skills)
        )

    if skill_match >= 80:
        reasons.append(
            "Strong skill alignment with the job."
        )
    elif skill_match >= 50:
        reasons.append(
            "Moderate skill alignment with the job."
        )
    else:
        reasons.append(
            "Limited skill alignment with the job."
        )

    if experience_match >= 100:
        reasons.append(
            "Your experience matches the stated requirement."
        )
    elif experience_match >= 70:
        reasons.append(
            "Your experience is reasonably close to the stated requirement."
        )
    else:
        reasons.append(
            "Your experience is below the stated requirement."
        )

    if location_match == 100:
        reasons.append(
            "The job location matches your location preference."
        )
    elif location_match == 50:
        reasons.append(
            "The job location could not be fully evaluated."
        )
    else:
        reasons.append(
            "The job location does not match your current preference."
        )

    if work_mode_match == 100:
        reasons.append(
            "The work mode matches your preference."
        )
    elif work_mode_match == 50:
        reasons.append(
            "The work mode could not be fully evaluated."
        )
    else:
        reasons.append(
            "The work mode does not match your preference."
        )

    return reasons