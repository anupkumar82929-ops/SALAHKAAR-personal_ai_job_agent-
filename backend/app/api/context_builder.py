from app.database.connection import get_connection


def build_user_context(user_id: int) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:

            # User
            cursor.execute(
                """
                SELECT
                    id,
                    email,
                    full_name
                FROM users
                WHERE id = %s;
                """,
                (user_id,),
            )

            user = cursor.fetchone()

            if user is None:
                raise ValueError("User not found.")

            # Profile
            cursor.execute(
                """
                SELECT
                    headline,
                    summary,
                    years_of_experience,
                    current_location,
                    preferred_locations,
                    preferred_work_mode,
                    expected_salary_min,
                    expected_salary_max
                FROM profiles
                WHERE user_id = %s;
                """,
                (user_id,),
            )

            profile = cursor.fetchone()

            # Skills
            cursor.execute(
                """
                SELECT
                    s.name,
                    us.proficiency
                FROM user_skills us
                JOIN skills s
                    ON s.id = us.skill_id
                WHERE us.user_id = %s
                ORDER BY s.name;
                """,
                (user_id,),
            )

            skills = cursor.fetchall()

            # Education
            cursor.execute(
                """
                SELECT
                    institution,
                    degree,
                    field_of_study,
                    start_date,
                    end_date,
                    grade,
                    description
                FROM education
                WHERE user_id = %s
                ORDER BY end_date DESC NULLS LAST;
                """,
                (user_id,),
            )

            education = cursor.fetchall()

            # Experience
            cursor.execute(
                """
                SELECT
                    company,
                    job_title,
                    location,
                    employment_type,
                    start_date,
                    end_date,
                    is_current,
                    description
                FROM experience
                WHERE user_id = %s
                ORDER BY start_date DESC NULLS LAST;
                """,
                (user_id,),
            )

            experience = cursor.fetchall()

            # Projects
            cursor.execute(
                """
                SELECT
                    name,
                    description,
                    project_url,
                    github_url,
                    start_date,
                    end_date
                FROM projects
                WHERE user_id = %s
                ORDER BY end_date DESC NULLS LAST;
                """,
                (user_id,),
            )

            projects = cursor.fetchall()

            # Certifications
            cursor.execute(
                """
                SELECT
                    name,
                    issuing_organization,
                    issue_date,
                    expiry_date,
                    credential_id,
                    credential_url
                FROM certifications
                WHERE user_id = %s
                ORDER BY issue_date DESC NULLS LAST;
                """,
                (user_id,),
            )

            certifications = cursor.fetchall()

            # Saved jobs
            cursor.execute(
                """
                SELECT
                    j.id,
                    j.title,
                    j.company,
                    j.location,
                    j.work_mode,
                    j.application_url
                FROM saved_jobs sj
                JOIN jobs j
                    ON j.id = sj.job_id
                WHERE sj.user_id = %s
                ORDER BY sj.created_at DESC;
                """,
                (user_id,),
            )

            saved_jobs = cursor.fetchall()

            # Applications
            cursor.execute(
                """
                SELECT
                    a.id,
                    a.status,
                    a.applied_at,
                    a.interview_at,
                    a.offer_at,
                    a.rejected_at,
                    a.notes,
                    j.id,
                    j.title,
                    j.company
                FROM applications a
                JOIN jobs j
                    ON j.id = a.job_id
                WHERE a.user_id = %s
                ORDER BY a.updated_at DESC;
                """,
                (user_id,),
            )

            applications = cursor.fetchall()

    return {
        "user": {
            "id": user[0],
            "email": user[1],
            "full_name": user[2],
        },

        "profile": (
            {
                "headline": profile[0],
                "summary": profile[1],
                "years_of_experience": float(profile[2] or 0),
                "current_location": profile[3],
                "preferred_locations": profile[4],
                "preferred_work_mode": profile[5],
                "expected_salary_min": (
                    float(profile[6])
                    if profile[6] is not None
                    else None
                ),
                "expected_salary_max": (
                    float(profile[7])
                    if profile[7] is not None
                    else None
                ),
            }
            if profile
            else None
        ),

        "skills": [
            {
                "name": row[0],
                "proficiency": row[1],
            }
            for row in skills
        ],

        "education": [
            {
                "institution": row[0],
                "degree": row[1],
                "field_of_study": row[2],
                "start_date": row[3],
                "end_date": row[4],
                "grade": row[5],
                "description": row[6],
            }
            for row in education
        ],

        "experience": [
            {
                "company": row[0],
                "job_title": row[1],
                "location": row[2],
                "employment_type": row[3],
                "start_date": row[4],
                "end_date": row[5],
                "is_current": row[6],
                "description": row[7],
            }
            for row in experience
        ],

        "projects": [
            {
                "name": row[0],
                "description": row[1],
                "project_url": row[2],
                "github_url": row[3],
                "start_date": row[4],
                "end_date": row[5],
            }
            for row in projects
        ],

        "certifications": [
            {
                "name": row[0],
                "issuing_organization": row[1],
                "issue_date": row[2],
                "expiry_date": row[3],
                "credential_id": row[4],
                "credential_url": row[5],
            }
            for row in certifications
        ],

        "saved_jobs": [
            {
                "id": row[0],
                "title": row[1],
                "company": row[2],
                "location": row[3],
                "work_mode": row[4],
                "application_url": row[5],
            }
            for row in saved_jobs
        ],

        "applications": [
            {
                "id": row[0],
                "status": row[1],
                "applied_at": row[2],
                "interview_at": row[3],
                "offer_at": row[4],
                "rejected_at": row[5],
                "notes": row[6],
                "job": {
                    "id": row[7],
                    "title": row[8],
                    "company": row[9],
                },
            }
            for row in applications
        ],
    }