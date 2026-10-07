def calculate_skill_match(
    user_skills: set[str],
    job_skills: set[str],
) -> float:
    """
    Calculate skill-match percentage between the user and a job.

    Returns a value between 0 and 100.
    """

    if not job_skills:
        return 0.0

    normalized_user_skills = {
        skill.strip().lower()
        for skill in user_skills
        if skill and skill.strip()
    }

    normalized_job_skills = {
        skill.strip().lower()
        for skill in job_skills
        if skill and skill.strip()
    }

    if not normalized_job_skills:
        return 0.0

    matched_skills = (
        normalized_user_skills & normalized_job_skills
    )

    score = (
        len(matched_skills)
        / len(normalized_job_skills)
    ) * 100

    return round(score, 2)
def calculate_experience_match(
    user_experience: float,
    job_min_experience: float | None,
    job_max_experience: float | None,
) -> float:
    """
    Calculate experience-match percentage.

    Returns a value between 0 and 100.
    """

    user_experience = max(0.0, user_experience)

    if job_min_experience is None and job_max_experience is None:
        return 100.0

    if job_min_experience is not None and user_experience < job_min_experience:
        if job_min_experience == 0:
            return 100.0

        score = (user_experience / job_min_experience) * 100
        return round(min(score, 100.0), 2)

    if job_max_experience is not None and user_experience > job_max_experience:
        difference = user_experience - job_max_experience

        if job_max_experience == 0:
            return 50.0

        penalty = (difference / job_max_experience) * 50
        return round(max(100.0 - penalty, 50.0), 2)

    return 100.0
def calculate_location_match(
    user_location: str | None,
    preferred_locations: str | None,
    job_location: str | None,
) -> float:
    """
    Calculate location-match percentage.

    Returns a value between 0 and 100.
    """

    if not job_location:
        return 50.0

    normalized_job_location = job_location.strip().lower()

    if preferred_locations:
        locations = {
            location.strip().lower()
            for location in preferred_locations.split(",")
            if location.strip()
        }

        for location in locations:
            if location in normalized_job_location:
                return 100.0

    if user_location:
        normalized_user_location = user_location.strip().lower()

        if normalized_user_location in normalized_job_location:
            return 100.0

    return 0.0
def calculate_work_mode_match(
    preferred_work_mode: str | None,
    job_work_mode: str | None,
) -> float:
    """
    Calculate work-mode match percentage.

    Returns a value between 0 and 100.
    """

    if not job_work_mode:
        return 50.0

    if not preferred_work_mode:
        return 50.0

    user_mode = preferred_work_mode.strip().lower()
    job_mode = job_work_mode.strip().lower()

    if user_mode == job_mode:
        return 100.0

    return 0.0
def calculate_match_score(
    skill_match: float,
    experience_match: float,
    location_match: float,
    work_mode_match: float,
) -> float:
    """
    Calculate the overall job match score.

    Weights:
    - Skills: 50%
    - Experience: 20%
    - Location: 15%
    - Work mode: 15%
    """

    score = (
        skill_match * 0.50
        + experience_match * 0.20
        + location_match * 0.15
        + work_mode_match * 0.15
    )

    return round(score, 2)