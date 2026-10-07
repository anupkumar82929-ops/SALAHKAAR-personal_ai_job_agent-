from fastapi import APIRouter, Depends, Query
from app.api.auth import get_current_user
from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


@router.get("")
def get_jobs(
    keyword: str | None = Query(default=None),
    location: str | None = Query(default=None),
    work_mode: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    conditions = []
    values = []

    if keyword:
        conditions.append(
            """
            (
                title ILIKE %s
                OR company ILIKE %s
                OR description ILIKE %s
            )
            """
        )

        keyword_value = f"%{keyword}%"

        values.extend([
            keyword_value,
            keyword_value,
            keyword_value,
        ])

    if location:
        conditions.append("location ILIKE %s")
        values.append(f"%{location}%")

    if work_mode:
        conditions.append("work_mode ILIKE %s")
        values.append(f"%{work_mode}%")

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            id,
            source,
            external_id,
            title,
            company,
            location,
            work_mode,
            employment_type,
            experience_min,
            experience_max,
            salary_min,
            salary_max,
            salary_currency,
            description,
            application_url,
            posted_at,
            expires_at,
            created_at,
            updated_at
        FROM jobs
        {where_clause}
        ORDER BY posted_at DESC NULLS LAST, created_at DESC
        LIMIT %s
        OFFSET %s;
    """
    count_query = f"""
        SELECT COUNT(*)
        FROM jobs
        {where_clause};
    """
    values.extend([limit, offset])

    with get_connection() as connection:
        with connection.cursor() as cursor:
           
            cursor.execute(count_query, values[:-2])
            total = cursor.fetchone()[0] 
            
            
            cursor.execute(query, values)
            rows = cursor.fetchall()

    jobs = []

    for row in rows:
        jobs.append(
            {
                "id": row[0],
                "source": row[1],
                "external_id": row[2],
                "title": row[3],
                "company": row[4],
                "location": row[5],
                "work_mode": row[6],
                "employment_type": row[7],
                "experience_min": row[8],
                "experience_max": row[9],
                "salary_min": row[10],
                "salary_max": row[11],
                "salary_currency": row[12],
                "description": row[13],
                "application_url": row[14],
                "posted_at": row[15],
                "expires_at": row[16],
                "created_at": row[17],
                "updated_at": row[18],
            }
        )

    return {
        "count": len(jobs),
        "total": total,
        "limit": limit,
        "offset": offset,
        "jobs": jobs,
    }