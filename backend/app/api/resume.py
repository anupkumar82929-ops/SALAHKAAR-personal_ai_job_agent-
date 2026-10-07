from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader

from app.core.dependencies import get_current_user
from app.database.connection import get_connection
from app.services.resume_parser import parse_resume
from psycopg.types.json import Jsonb

router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)

@router.get("")
def get_user_resumes(
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        file_name,
                        file_path,
                        parsed_data,
                        is_primary,
                        created_at,
                        updated_at
                    FROM resumes
                    WHERE user_id = %s
                    ORDER BY
                        is_primary DESC,
                        created_at DESC;
                    """,
                    (user_id,),
                )

                rows = cursor.fetchall()

        resumes = []

        for row in rows:

            resumes.append(
                {
                    "id": row[0],
                    "file_name": row[1],
                    "file_path": row[2],
                    "parsed_data": row[3],
                    "is_primary": row[4],
                    "created_at": row[5],
                    "updated_at": row[6],
                }
            )

        return {
            "count": len(resumes),
            "resumes": resumes,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve resumes: {str(error)}",
        )

BASE_DIR = Path(__file__).resolve().parents[3]
RESUME_DIR = BASE_DIR / "data" / "resumes"

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    # -----------------------------------------
    # 1. Validate filename
    # -----------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A resume file is required.",
        )

    # -----------------------------------------
    # 2. Validate extension
    # -----------------------------------------

    extension = Path(file.filename).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are currently supported.",
        )

    # -----------------------------------------
    # 3. Read uploaded file
    # -----------------------------------------

    file_content = await file.read()

    # -----------------------------------------
    # 4. Validate file size
    # -----------------------------------------

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Resume file must be smaller than 5 MB.",
        )

    if len(file_content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # -----------------------------------------
    # 5. Create resume directory
    # -----------------------------------------

    RESUME_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # -----------------------------------------
    # 6. Generate safe unique filename
    # -----------------------------------------

    stored_filename = f"{uuid4().hex}.pdf"

    file_path = RESUME_DIR / stored_filename

    # -----------------------------------------
    # 7. Save physical PDF
    # -----------------------------------------

    file_path.write_bytes(file_content)

    try:

        with get_connection() as connection:

            with connection.cursor() as cursor:

                # -----------------------------------------
                # 8. Remove primary status from old resume
                # -----------------------------------------

                cursor.execute(
                    """
                    UPDATE resumes
                    SET
                        is_primary = FALSE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    AND is_primary = TRUE;
                    """,
                    (user_id,),
                )

                # -----------------------------------------
                # 9. Insert new resume as primary
                # -----------------------------------------

                cursor.execute(
                    """
                    INSERT INTO resumes
                    (
                        user_id,
                        file_name,
                        file_path,
                        is_primary
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    RETURNING
                        id,
                        file_name,
                        file_path,
                        is_primary,
                        created_at;
                    """,
                    (
                        user_id,
                        file.filename,
                        str(file_path),
                        True,
                    ),
                )

                resume = cursor.fetchone()

        # -----------------------------------------
        # 10. Return response
        # -----------------------------------------

        return {
            "message": "Resume uploaded successfully.",
            "resume": {
                "id": resume[0],
                "file_name": resume[1],
                "file_path": resume[2],
                "is_primary": resume[3],
                "created_at": resume[4],
            },
        }

    except Exception as error:

        # -----------------------------------------
        # 11. Remove physical file if DB fails
        # -----------------------------------------

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to save resume information: {str(error)}",
        )
@router.post("/{resume_id}/extract")
def extract_resume_text(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:

        # -----------------------------------------
        # 1. Find the resume
        # -----------------------------------------

        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        file_name,
                        file_path
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found.",
            )

        # -----------------------------------------
        # 2. Check physical PDF file
        # -----------------------------------------

        file_path = Path(resume[2])

        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Resume file does not exist on the server.",
            )

        # -----------------------------------------
        # 3. Read PDF
        # -----------------------------------------

        reader = PdfReader(str(file_path))

        extracted_text = []

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:
                extracted_text.append(page_text)

        raw_text = "\n\n".join(extracted_text).strip()

        # -----------------------------------------
        # 4. Make sure text was extracted
        # -----------------------------------------

        if not raw_text:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Unable to extract text from this PDF. "
                    "The PDF may contain scanned images instead "
                    "of selectable text."
                ),
            )

        # -----------------------------------------
        # 5. Save RAW TEXT to PostgreSQL
        # -----------------------------------------

        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE resumes
                    SET
                        raw_text = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (
                        raw_text,
                        resume_id,
                        user_id,
                    ),
                )

        # -----------------------------------------
        # 6. Return extraction result
        # -----------------------------------------

        return {
            "message": "Resume text extracted successfully.",
            "resume_id": resume_id,
            "file_name": resume[1],
            "page_count": len(reader.pages),
            "character_count": len(raw_text),
            "text_preview": raw_text[:1000],
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to extract resume text: {str(error)}",
        )

@router.post("/{resume_id}/parse")
def parse_resume_data(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:

            with connection.cursor() as cursor:

                # Get resume text
                cursor.execute(
                    """
                    SELECT
                        id,
                        file_name,
                        raw_text
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

                if resume is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Resume not found.",
                    )

                if not resume[2]:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Resume text has not been extracted yet."
                        ),
                    )

                # Get known skills
                cursor.execute(
                    """
                    SELECT name
                    FROM skills
                    ORDER BY name;
                    """
                )

                known_skills = [
                    row[0]
                    for row in cursor.fetchall()
                ]

        # Parse resume
        parsed_data = parse_resume(
            resume[2],
            known_skills,
        )

        # Store parsed data
        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE resumes
                    SET
                        parsed_data = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (
                        Jsonb(parsed_data),
                        resume_id,
                        user_id,
                    ),
                )

        return {
            "message": "Resume parsed successfully.",
            "resume_id": resume_id,
            "file_name": resume[1],
            "parsed_data": parsed_data,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to parse resume: {str(error)}",
        )

@router.post("/{resume_id}/education/sync")
def sync_resume_education(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:

        # -----------------------------------------
        # 1. Get parsed resume data
        # -----------------------------------------

        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found.",
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet.",
            )

        education_entries = parsed_data.get(
            "education",
            [],
        )

        if not education_entries:
            raise HTTPException(
                status_code=422,
                detail="No education information was found in the resume.",
            )

        # -----------------------------------------
        # 2. Save education records
        # -----------------------------------------

        inserted_records = []

        with get_connection() as connection:

            with connection.cursor() as cursor:

                # Remove education records previously
                # generated from this same resume.
                cursor.execute(
                    """
                    DELETE FROM education
                    WHERE user_id = %s
                    AND source_resume_id = %s;
                    """,
                    (
                        user_id,
                        resume_id,
                    ),
                )

                for entry in education_entries:

                    institution = entry.get(
                        "institution"
                    )

                    degree = entry.get(
                        "degree"
                    )

                    field_of_study = entry.get(
                        "field_of_study"
                    )

                    start_date = entry.get(
                        "start_date"
                    )

                    end_date = entry.get(
                        "end_date"
                    )

                    grade = entry.get(
                        "grade"
                    )

                    description = entry.get(
                        "description"
                    )

                    # Skip completely empty records
                    if not any([
                        institution,
                        degree,
                        field_of_study,
                        grade,
                        description,
                    ]):
                        continue

                    cursor.execute(
                        """
                        INSERT INTO education
                        (
                            user_id,
                            institution,
                            degree,
                            field_of_study,
                            start_date,
                            end_date,
                            grade,
                            description,
                            source_resume_id
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        RETURNING
                            id,
                            institution,
                            degree,
                            field_of_study,
                            grade;
                        """,
                        (
                            user_id,
                            institution,
                            degree,
                            field_of_study,
                            start_date,
                            end_date,
                            grade,
                            description,
                            resume_id,
                        ),
                    )

                    record = cursor.fetchone()

                    inserted_records.append({
                        "id": record[0],
                        "institution": record[1],
                        "degree": record[2],
                        "field_of_study": record[3],
                        "grade": record[4],
                    })

        return {
            "message": "Education synchronized successfully.",
            "resume_id": resume_id,
            "records_created": len(inserted_records),
            "education": inserted_records,
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to save education: {str(error)}",
        )
@router.post("/{resume_id}/education/sync")
def sync_resume_education(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        # 1. Get parsed resume data
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id, parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found.",
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet.",
            )

        education_entries = parsed_data.get("education", [])

        if not education_entries:
            raise HTTPException(
                status_code=422,
                detail="No education information was found in the resume.",
            )

        # 2. Save education records
        inserted_records = []

        with get_connection() as connection:
            with connection.cursor() as cursor:

                # Remove old records generated from this resume
                cursor.execute(
                    """
                    DELETE FROM education
                    WHERE user_id = %s
                    AND source_resume_id = %s;
                    """,
                    (user_id, resume_id),
                )

                for entry in education_entries:

                    institution = entry.get("institution")
                    degree = entry.get("degree")
                    field_of_study = entry.get("field_of_study")
                    start_date = entry.get("start_date")
                    end_date = entry.get("end_date")
                    grade = entry.get("grade")
                    description = entry.get("description")

                    # Ignore completely empty entries
                    if not any([
                        institution,
                        degree,
                        field_of_study,
                        grade,
                        description,
                    ]):
                        continue

                    cursor.execute(
                        """
                        INSERT INTO education
                        (
                            user_id,
                            institution,
                            degree,
                            field_of_study,
                            start_date,
                            end_date,
                            grade,
                            description,
                            source_resume_id
                        )
                        VALUES
                        (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                        RETURNING
                            id,
                            institution,
                            degree,
                            field_of_study,
                            grade;
                        """,
                        (
                            user_id,
                            institution,
                            degree,
                            field_of_study,
                            start_date,
                            end_date,
                            grade,
                            description,
                            resume_id,
                        ),
                    )

                    record = cursor.fetchone()

                    inserted_records.append({
                        "id": record[0],
                        "institution": record[1],
                        "degree": record[2],
                        "field_of_study": record[3],
                        "grade": record[4],
                    })

        return {
            "message": "Education synchronized successfully.",
            "resume_id": resume_id,
            "records_created": len(inserted_records),
            "education": inserted_records,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save education: {str(error)}",
        )

@router.post("/{resume_id}/experience/sync")
def sync_resume_experience(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        # Get parsed resume data
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id, parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found.",
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet.",
            )

        experience_entries = parsed_data.get(
            "experience",
            [],
        )

        if not experience_entries:
            raise HTTPException(
                status_code=422,
                detail="No experience information was found in the resume.",
            )

        inserted_records = []

        with get_connection() as connection:
            with connection.cursor() as cursor:

                # Remove records previously generated
                # from this resume
                cursor.execute(
                    """
                    DELETE FROM experience
                    WHERE user_id = %s
                    AND source_resume_id = %s;
                    """,
                    (user_id, resume_id),
                )

                for entry in experience_entries:

                    company = entry.get("company")
                    job_title = entry.get("job_title")
                    location = entry.get("location")
                    employment_type = entry.get("employment_type")
                    start_date = entry.get("start_date")
                    end_date = entry.get("end_date")
                    is_current = entry.get(
                        "is_current",
                        False,
                    )
                    description = entry.get("description")

                    # company and job_title are required
                    if not company or not job_title:
                        continue

                    cursor.execute(
                        """
                        INSERT INTO experience
                        (
                            user_id,
                            company,
                            job_title,
                            location,
                            employment_type,
                            start_date,
                            end_date,
                            is_current,
                            description,
                            source_resume_id
                        )
                        VALUES
                        (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s
                        )
                        RETURNING
                            id,
                            company,
                            job_title,
                            location,
                            employment_type,
                            is_current;
                        """,
                        (
                            user_id,
                            company,
                            job_title,
                            location,
                            employment_type,
                            start_date,
                            end_date,
                            is_current,
                            description,
                            resume_id,
                        ),
                    )

                    record = cursor.fetchone()

                    inserted_records.append({
                        "id": record[0],
                        "company": record[1],
                        "job_title": record[2],
                        "location": record[3],
                        "employment_type": record[4],
                        "is_current": record[5],
                    })

        return {
            "message": "Experience synchronized successfully.",
            "resume_id": resume_id,
            "records_created": len(inserted_records),
            "experience": inserted_records,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save experience: {str(error)}",
        )
@router.post("/{resume_id}/certifications/sync")
def sync_resume_certifications(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found."
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet."
            )

        certification_entries = parsed_data.get(
            "certifications",
            []
        )

        if not certification_entries:
            raise HTTPException(
                status_code=422,
                detail="No certification information was found in the resume."
            )

        inserted_records = []

        with get_connection() as connection:
            with connection.cursor() as cursor:

                # Remove certifications previously imported
                # from this resume.
                #
                # source_resume_id will be added in the next
                # migration so certifications can be traced
                # back to their source resume.

                for entry in certification_entries:

                    name = entry.get("name")

                    if not name:
                        continue

                    issuing_organization = entry.get(
                        "issuing_organization"
                    )

                    issue_date = entry.get("issue_date")

                    expiry_date = entry.get("expiry_date")

                    credential_id = entry.get(
                        "credential_id"
                    )

                    credential_url = entry.get(
                        "credential_url"
                    )

                    cursor.execute(
                        """
                        INSERT INTO certifications
                        (
                            user_id,
                            name,
                            issuing_organization,
                            issue_date,
                            expiry_date,
                            credential_id,
                            credential_url,
                            source_resume_id
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        RETURNING
                            id,
                            name,
                            issuing_organization,
                            issue_date,
                            expiry_date,
                            credential_id,
                            credential_url,
                            source_resume_id;
                        """,
                        (
                            user_id,
                            name,
                            issuing_organization,
                            issue_date,
                            expiry_date,
                            credential_id,
                            credential_url,
                            resume_id,
                        ),
                    )

                    record = cursor.fetchone()

                    inserted_records.append({
                        "id": record[0],
                        "name": record[1],
                        "issuing_organization": record[2],
                        "issue_date": record[3],
                        "expiry_date": record[4],
                        "credential_id": record[5],
                        "credential_url": record[6],
                        "source_resume_id":record[7],
                    })

        return {
            "message": "Certifications synchronized successfully.",
            "resume_id": resume_id,
            "records_created": len(inserted_records),
            "certifications": inserted_records,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save certifications: {str(error)}",
        )

@router.post("/{resume_id}/skills/sync")
def sync_resume_skills(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        # 1. Get resume and parsed data
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found."
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet."
            )

        resume_skills = parsed_data.get("skills", [])

        if not resume_skills:
            raise HTTPException(
                status_code=422,
                detail="No skills were found in the resume."
            )

        synchronized_skills = []

        # 2. Synchronize skills
        with get_connection() as connection:
            with connection.cursor() as cursor:

                for skill_name in resume_skills:

                    skill_name = skill_name.strip()

                    if not skill_name:
                        continue

                    # Find existing skill
                    cursor.execute(
                        """
                        SELECT id, name
                        FROM skills
                        WHERE LOWER(name) = LOWER(%s);
                        """,
                        (skill_name,),
                    )

                    skill = cursor.fetchone()

                    # Create skill if it doesn't exist
                    if skill is None:
                        cursor.execute(
                            """
                            INSERT INTO skills (name)
                            VALUES (%s)
                            RETURNING id, name;
                            """,
                            (skill_name,),
                        )

                        skill = cursor.fetchone()

                    skill_id = skill[0]
                    normalized_name = skill[1]

                    # Connect skill to user.
                    # ON CONFLICT prevents duplicate relationships.
                    cursor.execute(
                        """
                        INSERT INTO user_skills
                        (
                            user_id,
                            skill_id,
                            proficiency
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s
                        )
                        ON CONFLICT (user_id, skill_id)
                        DO NOTHING;
                        """,
                        (
                            user_id,
                            skill_id,
                            None,
                        ),
                    )

                    synchronized_skills.append({
                        "skill_id": skill_id,
                        "name": normalized_name,
                    })

        return {
            "message": "Resume skills synchronized successfully.",
            "resume_id": resume_id,
            "skills_count": len(synchronized_skills),
            "skills": synchronized_skills,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to synchronize resume skills: {str(error)}",
        )

from datetime import date, datetime

@router.post("/{resume_id}/profile/sync")
def sync_resume_profile(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        # Get resume and parsed data
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, parsed_data
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

        if resume is None:
            raise HTTPException(
                status_code=404,
                detail="Resume not found."
            )

        parsed_data = resume[1]

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="Resume has not been parsed yet."
            )

        experience_entries = parsed_data.get("experience", [])

        if not experience_entries:
            raise HTTPException(
                status_code=422,
                detail="No experience information was found in the resume."
            )

        total_days = 0
        latest_location = None
        latest_start_date = None

        today = date.today()

        for entry in experience_entries:

            start_value = entry.get("start_date")
            end_value = entry.get("end_date")
            is_current = entry.get("is_current", False)

            # Get location from current/latest experience
            location = entry.get("location")

            # Convert start date
            start_date = None

            if start_value:
                try:
                    if isinstance(start_value, date):
                        start_date = start_value
                    else:
                        start_date = datetime.strptime(
                            str(start_value),
                            "%Y-%m-%d"
                        ).date()
                except ValueError:
                    start_date = None

            # Convert end date
            end_date = None

            if end_value:
                try:
                    if isinstance(end_value, date):
                        end_date = end_value
                    else:
                        end_date = datetime.strptime(
                            str(end_value),
                            "%Y-%m-%d"
                        ).date()
                except ValueError:
                    end_date = None

            # Current employment continues until today
            if is_current:
                end_date = today

            if start_date:
                if end_date is None:
                    end_date = start_date

                if end_date >= start_date:
                    total_days += (
                        end_date - start_date
                    ).days

                # Keep the location belonging to the
                # latest experience entry.
                if (
                    latest_start_date is None
                    or start_date > latest_start_date
                ):
                    latest_start_date = start_date

                    if location:
                        latest_location = location

        # Convert total experience into years.
        years_of_experience = round(
            total_days / 365.25,
            1
        )

        # Find the user's profile
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM profiles
                    WHERE user_id = %s;
                    """,
                    (user_id,),
                )

                profile = cursor.fetchone()

                if profile is None:
                    raise HTTPException(
                        status_code=404,
                        detail="User profile not found."
                    )

                cursor.execute(
                    """
                    UPDATE profiles
                    SET
                        years_of_experience = %s,
                        current_location = COALESCE(%s, current_location),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    RETURNING
                        id,
                        years_of_experience,
                        current_location;
                    """,
                    (
                        years_of_experience,
                        latest_location,
                        user_id,
                    ),
                )

                updated_profile = cursor.fetchone()

        return {
            "message": "Resume profile synchronized successfully.",
            "resume_id": resume_id,
            "profile": {
                "id": updated_profile[0],
                "years_of_experience": float(
                    updated_profile[1]
                ),
                "current_location": updated_profile[2],
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to synchronize resume profile: {str(error)}",
        )
@router.post("/{resume_id}/primary")
def set_primary_resume(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id, file_name
                    FROM resumes
                    WHERE id = %s
                    AND user_id = %s;
                    """,
                    (resume_id, user_id),
                )

                resume = cursor.fetchone()

                if resume is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Resume not found."
                    )

                cursor.execute(
                    """
                    UPDATE resumes
                    SET
                        is_primary = FALSE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    AND is_primary = TRUE;
                    """,
                    (user_id,),
                )

                cursor.execute(
                    """
                    UPDATE resumes
                    SET
                        is_primary = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    AND user_id = %s
                    RETURNING
                        id,
                        file_name,
                        is_primary,
                        updated_at;
                    """,
                    (resume_id, user_id),
                )

                updated_resume = cursor.fetchone()

        return {
            "message": "Primary resume updated successfully.",
            "resume": {
                "id": updated_resume[0],
                "file_name": updated_resume[1],
                "is_primary": updated_resume[2],
                "updated_at": updated_resume[3],
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to set primary resume: {str(error)}",
        )