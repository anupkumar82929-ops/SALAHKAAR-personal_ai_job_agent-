from app.database.connection import get_connection


def get_or_create_skill(skill_name: str) -> int:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO skills (name)
                VALUES (%s)
                ON CONFLICT (name)
                DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
                """,
                (skill_name,),
            )

            return cursor.fetchone()[0]


def link_skill_to_job(
    job_id: int,
    skill_id: int,
    required: bool = True,
) -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO job_skills
                (
                    job_id,
                    skill_id,
                    required
                )
                VALUES (%s, %s, %s)
                ON CONFLICT (job_id, skill_id)
                DO UPDATE SET
                    required = EXCLUDED.required;
                """,
                (job_id, skill_id, required),
            )


def save_job_skills(
    job_id: int,
    skill_names: list[str],
) -> list[int]:

    skill_ids = []

    for skill_name in skill_names:
        skill_id = get_or_create_skill(skill_name)

        link_skill_to_job(
            job_id=job_id,
            skill_id=skill_id,
        )

        skill_ids.append(skill_id)

    return skill_ids