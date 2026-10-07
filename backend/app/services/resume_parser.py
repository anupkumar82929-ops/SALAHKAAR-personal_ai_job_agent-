import re


def extract_email(text: str) -> str | None:
    pattern = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"

    match = re.search(pattern, text)

    if match:
        return match.group(0)

    return None


def extract_phone(text: str) -> str | None:
    patterns = [
        r"\+91[\s-]?[6-9]\d{9}",
        r"\b[6-9]\d{9}\b",
        r"\+?\d[\d\s()-]{8,14}\d",
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if match:
            return match.group(0).strip()

    return None


def extract_skills(
    text: str,
    known_skills: list[str],
) -> list[str]:

    text_lower = text.lower()

    found_skills = []

    for skill in known_skills:

        skill_lower = skill.lower()

        if skill_lower in text_lower:
            found_skills.append(skill)

    return sorted(
        set(found_skills),
        key=str.lower,
    )


def parse_resume(text: str, known_skills: list[str]) -> dict:

    education_text = extract_education_section(text)
    education = parse_education_entries(education_text)

    experience_text = extract_experience_section(text)
    experience = parse_experience_entries(experience_text)

    projects_text = extract_projects_section(text)
    projects = parse_project_entries(projects_text)

    certifications_text = extract_certifications_section(text)
    certifications = parse_certification_entries(certifications_text)

    return {
        "contact": {
            "email": extract_email(text),
            "phone": extract_phone(text),
        },
        "skills": extract_skills(text, known_skills),
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
    }
def extract_education_section(text: str) -> str:
    """
    Extract the text belonging to the education section.
    """

    section_pattern = (
        r"(?is)"
        r"(?:education|academic background|academic qualification)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?="
        r"\n\s*(?:experience|work experience|employment|"
        r"projects|certifications|skills|technical skills|"
        r"achievements|internship|interests|"
        r"languages|references)\b"
        r"|$)"
    )

    match = re.search(section_pattern, text)

    if match:
        return match.group(1).strip()

    return ""

def parse_education_entries(
    education_text: str,
) -> list[dict]:

    if not education_text:
        return []

    lines = [
        line.strip()
        for line in education_text.splitlines()
        if line.strip()
    ]

    entries = []

    current_entry = {
        "institution": None,
        "degree": None,
        "field_of_study": None,
        "start_date": None,
        "end_date": None,
        "grade": None,
        "description": None,
    }

    for line in lines:

        lower_line = line.lower()

        # -----------------------------------------
        # Degree detection
        # -----------------------------------------

        degree_keywords = [
            "b.tech",
            "btech",
            "b.e",
            "be ",
            "bachelor",
            "m.tech",
            "mtech",
            "m.e",
            "master",
            "mba",
            "mca",
            "bca",
            "b.sc",
            "bsc",
            "m.sc",
            "msc",
            "phd",
            "diploma",
            "higher secondary",
            "senior secondary",
            "12th",
            "10th",
        ]

        if any(keyword in lower_line for keyword in degree_keywords):

            if (
                current_entry["degree"]
                or current_entry["institution"]
            ):
                entries.append(current_entry)

                current_entry = {
                    "institution": None,
                    "degree": None,
                    "field_of_study": None,
                    "start_date": None,
                    "end_date": None,
                    "grade": None,
                    "description": None,
                }

            current_entry["degree"] = line

            continue

        # -----------------------------------------
        # Grade detection
        # -----------------------------------------

        grade_match = re.search(
            r"(?i)(?:cgpa|gpa|percentage|percent|score|grade)"
            r"\s*[:\-]?\s*"
            r"([0-9]+(?:\.[0-9]+)?%?)",
            line,
        )

        if grade_match:

            current_entry["grade"] = grade_match.group(1)

            continue

        # -----------------------------------------
        # Date detection
        # -----------------------------------------

        date_match = re.search(
            r"\b(19|20)\d{2}\b"
            r"(?:\s*[-–]\s*"
            r"((?:19|20)\d{2}|present|current))?",
            line,
            re.IGNORECASE,
        )

        if date_match:

            start_year = date_match.group(0)

            current_entry["description"] = (
                (
                    current_entry["description"] or ""
                )
                + " "
                + line
            ).strip()

            continue

        # -----------------------------------------
        # Institution detection
        # -----------------------------------------

        institution_keywords = [
            "university",
            "college",
            "institute",
            "school",
            "academy",
        ]

        if any(
            keyword in lower_line
            for keyword in institution_keywords
        ):

            if current_entry["institution"] is None:

                current_entry["institution"] = line

            else:

                current_entry["description"] = (
                    (
                        current_entry["description"] or ""
                    )
                    + " "
                    + line
                ).strip()

            continue

        # -----------------------------------------
        # General information
        # -----------------------------------------

        if current_entry["description"] is None:

            current_entry["description"] = line

        else:

            current_entry["description"] = (
                current_entry["description"]
                + " "
                + line
            ).strip()

    # Add final entry
    if any(current_entry.values()):
        entries.append(current_entry)

    return entries
def extract_experience_section(text: str) -> str:
    """
    Extract the experience/work section from a resume.
    """

    section_pattern = (
        r"(?is)"
        r"(?:experience|work experience|employment history|"
        r"professional experience|internship experience)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?="
        r"\n\s*(?:education|academic background|"
        r"projects|certifications|skills|technical skills|"
        r"achievements|interests|languages|references)\b"
        r"|$)"
    )

    match = re.search(section_pattern, text)

    if match:
        return match.group(1).strip()

    return ""
def parse_experience_entries(
    experience_text: str,
) -> list[dict]:

    if not experience_text:
        return []

    lines = [
        line.strip()
        for line in experience_text.splitlines()
        if line.strip()
    ]

    entries = []

    current_entry = {
        "company": None,
        "job_title": None,
        "location": None,
        "employment_type": None,
        "start_date": None,
        "end_date": None,
        "is_current": False,
        "description": None,
    }

    for line in lines:

        lower_line = line.lower()

        # -----------------------------------------
        # Detect current employment
        # -----------------------------------------

        if re.search(
            r"\b(present|current|ongoing)\b",
            lower_line,
        ):
            current_entry["is_current"] = True

        # -----------------------------------------
        # Detect date ranges
        # -----------------------------------------

        date_match = re.search(
            r"\b((?:19|20)\d{2})"
            r"\s*[-–]\s*"
            r"((?:19|20)\d{2}|present|current)\b",
            lower_line,
        )

        if date_match:

            current_entry["start_date"] = (
                date_match.group(1)
            )

            current_entry["end_date"] = (
                date_match.group(2)
            )

            continue

        # -----------------------------------------
        # Detect company
        # -----------------------------------------

        company_keywords = [
            "company",
            "pvt",
            "private limited",
            "limited",
            "ltd",
            "technologies",
            "technology",
            "solutions",
            "systems",
            "inc",
            "corp",
        ]

        if (
            current_entry["company"] is None
            and any(
                keyword in lower_line
                for keyword in company_keywords
            )
        ):
            current_entry["company"] = line
            continue

        # -----------------------------------------
        # Detect job title
        # -----------------------------------------

        job_keywords = [
            "intern",
            "developer",
            "engineer",
            "analyst",
            "manager",
            "designer",
            "consultant",
            "associate",
            "administrator",
            "specialist",
            "scientist",
            "trainee",
            "executive",
        ]

        if (
            current_entry["job_title"] is None
            and any(
                keyword in lower_line
                for keyword in job_keywords
            )
        ):
            current_entry["job_title"] = line
            continue

        # -----------------------------------------
        # Detect location
        # -----------------------------------------

        location_keywords = [
            "india",
            "delhi",
            "noida",
            "gurgaon",
            "gurugram",
            "bangalore",
            "bengaluru",
            "hyderabad",
            "pune",
            "mumbai",
            "bhopal",
            "remote",
        ]

        if (
            current_entry["location"] is None
            and any(
                keyword in lower_line
                for keyword in location_keywords
            )
        ):
            current_entry["location"] = line
            continue

        # -----------------------------------------
        # Everything else → description
        # -----------------------------------------

        if current_entry["description"] is None:
            current_entry["description"] = line
        else:
            current_entry["description"] += " " + line

    # Add final entry
    if any([
        current_entry["company"],
        current_entry["job_title"],
        current_entry["description"],
    ]):
        entries.append(current_entry)

    return entries

def extract_projects_section(text: str) -> str:
    section_pattern = (
        r"(?is)"
        r"(?:projects|academic projects|personal projects|"
        r"project experience)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?="
        r"\n\s*(?:experience|work experience|employment|"
        r"education|academic background|certifications|"
        r"skills|technical skills|achievements|"
        r"internship|interests|languages|references)\b"
        r"|$)"
    )

    match = re.search(section_pattern, text)

    if match:
        return match.group(1).strip()

    return ""


def parse_project_entries(projects_text: str) -> list[dict]:
    if not projects_text:
        return []

    lines = [
        line.strip()
        for line in projects_text.splitlines()
        if line.strip()
    ]

    entries = []
    current_entry = {
        "name": None,
        "description": None,
        "project_url": None,
        "github_url": None,
        "start_date": None,
        "end_date": None,
    }

    for line in lines:

        # GitHub URL
        github_match = re.search(
            r"(https?://(?:www\.)?github\.com/[^\s]+)",
            line,
            re.IGNORECASE
        )

        if github_match:
            current_entry["github_url"] = github_match.group(1)
            continue

        # General project URL
        url_match = re.search(
            r"(https?://[^\s]+)",
            line,
            re.IGNORECASE
        )

        if url_match and "github.com" not in url_match.group(1).lower():
            current_entry["project_url"] = url_match.group(1)
            continue

        # Date range
        date_match = re.search(
            r"\b(20\d{2})\s*(?:-|–|—|to)\s*(20\d{2}|present|current)\b",
            line,
            re.IGNORECASE
        )

        if date_match:
            current_entry["start_date"] = f"{date_match.group(1)}-01-01"

            end_value = date_match.group(2).lower()

            if end_value in ("present", "current"):
                current_entry["end_date"] = None
            else:
                current_entry["end_date"] = f"{end_value}-12-31"

            continue

        # Detect a new project.
        # A new project is usually represented by a short heading.
        if (
            current_entry["name"] is None
            and len(line) <= 120
        ):
            current_entry["name"] = line
            continue

        # If a project name already exists and we encounter
        # another short heading, save the current project.
        if (
            current_entry["name"] is not None
            and len(line) <= 100
            and not line.endswith(".")
        ):
            entries.append(current_entry)

            current_entry = {
                "name": line,
                "description": None,
                "project_url": None,
                "github_url": None,
                "start_date": None,
                "end_date": None,
            }

            continue

        # Everything else becomes project description.
        if current_entry["name"] is not None:

            if current_entry["description"]:
                current_entry["description"] += " " + line
            else:
                current_entry["description"] = line

    # Save final project
    if current_entry["name"]:
        entries.append(current_entry)

    return entries

def extract_certifications_section(text: str) -> str:
    section_pattern = (
        r"(?is)"
        r"(?:certifications|certificates|professional certifications)"
        r"\s*:?\s*"
        r"(.*?)"
        r"(?="
        r"\n\s*(?:experience|work experience|employment|"
        r"education|academic background|projects|"
        r"skills|technical skills|achievements|"
        r"internship|interests|languages|references)\b"
        r"|$)"
    )

    match = re.search(section_pattern, text)

    if match:
        return match.group(1).strip()

    return ""


def parse_certification_entries(certifications_text: str) -> list[dict]:
    if not certifications_text:
        return []

    lines = [
        line.strip()
        for line in certifications_text.splitlines()
        if line.strip()
    ]

    entries = []

    for line in lines:
        entries.append({
            "name": line,
            "issuing_organization": None,
            "issue_date": None,
            "expiry_date": None,
            "credential_id": None,
            "credential_url": None,
        })

    return entries