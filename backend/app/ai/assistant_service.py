from collections import Counter

from app.database.connection import get_connection
from app.ai.conversation_repository import (
    add_message,
    get_conversation_messages,
)
from app.matching.service import calculate_job_match


# ============================================================
# INTENT DETECTION
# ============================================================

def detect_intent(message: str) -> str:

    text = message.lower().strip()

    # --------------------------------------------------------
    # RESUME
    # --------------------------------------------------------

    if (
        "resume" in text
        and any(
            word in text
            for word in [
                "improve",
                "better",
                "optimize",
                "update",
                "rewrite",
                "fix",
                "help",
                "change",
                "review",
            ]
        )
    ):
        return "resume"

    # --------------------------------------------------------
    # BEST MATCHES
    # --------------------------------------------------------

    if any(
        phrase in text
        for phrase in [
            "best match",
            "best matches",
            "best jobs",
            "top jobs",
            "matching jobs",
            "which jobs",
            "jobs match",
            "job matches",
            "jobs are the best",
        ]
    ):
        return "matches"

    # --------------------------------------------------------
    # APPLICATIONS
    # --------------------------------------------------------

    if any(
        phrase in text
        for phrase in [
            "my applications",
            "show applications",
            "show my applications",
            "applications",
            "applied jobs",
            "jobs i applied",
            "jobs have i applied",
        ]
    ):
        return "applications"

    # --------------------------------------------------------
    # MISSING SKILLS
    # --------------------------------------------------------

    if any(
        phrase in text
        for phrase in [
            "missing skills",
            "skills am i missing",
            "skills i'm missing",
            "skills i am missing",
            "what skills",
            "skills should i learn",
            "skills do i need",
        ]
    ):
        return "missing_skills"

    # --------------------------------------------------------
    # APPLICATION COUNT
    # --------------------------------------------------------

    if any(
        phrase in text
        for phrase in [
            "how many jobs",
            "how many applications",
            "number of applications",
            "how many have i applied",
            "application count",
        ]
    ):
        return "application_count"

    # --------------------------------------------------------
    # HELP
    # --------------------------------------------------------

    return "help"


# ============================================================
# GET USER SKILLS
# ============================================================

def get_user_skills(
    user_id: int,
) -> set[str]:

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT LOWER(s.name)
                FROM user_skills us
                JOIN skills s
                    ON s.id = us.skill_id
                WHERE us.user_id = %s;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

    return {
        row[0].strip().lower()
        for row in rows
        if row[0]
    }


# ============================================================
# GET RECENT JOBS
# ============================================================

def get_recent_job_ids(
    limit: int = 30,
) -> list[int]:

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT id
                FROM jobs
                ORDER BY
                    posted_at DESC NULLS LAST,
                    created_at DESC
                LIMIT %s;
                """,
                (limit,),
            )

            rows = cursor.fetchall()

    return [
        row[0]
        for row in rows
    ]


# ============================================================
# BEST MATCHES
# ============================================================

def get_best_matches(
    user_id: int,
    limit: int = 5,
) -> list[dict]:

    job_ids = get_recent_job_ids(
        limit=30,
    )

    matches = []

    for job_id in job_ids:

        try:

            match = calculate_job_match(
                user_id=user_id,
                job_id=job_id,
            )

            matches.append(match)

        except ValueError:
            continue

    matches.sort(
        key=lambda item: item.get(
            "match_score",
            0,
        ),
        reverse=True,
    )

    return matches[:limit]


# ============================================================
# BUILD BEST MATCHES RESPONSE
# ============================================================

def build_best_matches_response(
    user_id: int,
) -> str:

    matches = get_best_matches(
        user_id=user_id,
        limit=5,
    )

    if not matches:

        return (
            "I couldn't find any job matches yet.\n\n"
            "Make sure your profile and skills are completed "
            "and that jobs are available in the database."
        )

    lines = [
        "🎯 Here are your best current job matches:",
        "",
    ]

    for index, match in enumerate(
        matches,
        start=1,
    ):

        title = match.get(
            "title",
            "Unknown role",
        )

        company = match.get(
            "company",
            "Unknown company",
        )

        score = match.get(
            "match_score",
            0,
        )

        lines.append(
            f"{index}. {title} — {company}"
        )

        lines.append(
            f"   Match Score: {score}%"
        )

        reasons = match.get(
            "reasons",
            [],
        )

        if reasons:

            for reason in reasons[:2]:

                lines.append(
                    f"   • {reason}"
                )

        lines.append("")

    lines.append(
        "💡 Open a job's AI Analysis page for a "
        "detailed skill-by-skill comparison."
    )

    return "\n".join(lines)


# ============================================================
# GET MISSING SKILLS
# ============================================================

def get_missing_skill_frequency(
    user_id: int,
) -> tuple[set[str], Counter]:

    user_skills = get_user_skills(
        user_id=user_id,
    )

    skill_counter = Counter()

    matches = get_best_matches(
        user_id=user_id,
        limit=10,
    )

    for match in matches:

        job_skills = {
            skill.lower()
            for skill in match.get(
                "job_skills",
                [],
            )
        }

        missing = (
            job_skills
            - user_skills
        )

        for skill in missing:

            skill_counter[skill] += 1

    return (
        user_skills,
        skill_counter,
    )


# ============================================================
# BUILD MISSING SKILLS RESPONSE
# ============================================================

def build_missing_skills_response(
    user_id: int,
) -> str:

    user_skills, skill_counter = (
        get_missing_skill_frequency(
            user_id=user_id,
        )
    )

    if not skill_counter:

        return (
            "🎉 I couldn't identify any missing skills "
            "from your current matched jobs.\n\n"
            "Your recorded skills appear to align well "
            "with the available opportunities."
        )

    top_missing = skill_counter.most_common(
        8
    )

    lines = [
        "💡 Skills that could improve your job matches:",
        "",
    ]

    for index, (skill, count) in enumerate(
        top_missing,
        start=1,
    ):

        lines.append(
            f"{index}. {skill.title()} "
            f"— appears in {count} matched job(s)"
        )

    lines.extend(
        [
            "",
            "🎯 Recommendation:",
            "Prioritize the skills appearing most frequently "
            "across your target jobs.",
        ]
    )

    return "\n".join(lines)


# ============================================================
# GET APPLICATIONS
# ============================================================

def get_user_application_data(
    user_id: int,
) -> list[dict]:

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    a.id,
                    a.job_id,
                    a.status,
                    a.applied_at,
                    j.title,
                    j.company,
                    j.location
                FROM applications a
                JOIN jobs j
                    ON j.id = a.job_id
                WHERE a.user_id = %s
                ORDER BY a.applied_at DESC NULLS LAST,
                         a.id DESC;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

    applications = []

    for row in rows:

        applications.append(
            {
                "id": row[0],
                "job_id": row[1],
                "status": row[2],
                "applied_at": row[3],
                "title": row[4],
                "company": row[5],
                "location": row[6],
            }
        )

    return applications


# ============================================================
# BUILD APPLICATIONS RESPONSE
# ============================================================

def build_applications_response(
    user_id: int,
) -> str:

    applications = get_user_application_data(
        user_id=user_id,
    )

    if not applications:

        return (
            "📋 You haven't recorded any job applications yet.\n\n"
            "Go to Find Jobs, open a job, and use "
            "Apply Now to start tracking applications."
        )

    lines = [
        f"📋 You have {len(applications)} application(s):",
        "",
    ]

    for index, application in enumerate(
        applications[:10],
        start=1,
    ):

        title = application.get(
            "title",
            "Unknown role",
        )

        company = application.get(
            "company",
            "Unknown company",
        )

        status = application.get(
            "status",
            "Applied",
        )

        lines.append(
            f"{index}. {title} — {company}"
        )

        lines.append(
            f"   Status: {status}"
        )

        lines.append("")

    if len(applications) > 10:

        lines.append(
            f"...and {len(applications) - 10} more."
        )

    return "\n".join(lines)


# ============================================================
# APPLICATION COUNT
# ============================================================

def build_application_count_response(
    user_id: int,
) -> str:

    applications = get_user_application_data(
        user_id=user_id,
    )

    count = len(applications)

    if count == 0:

        return (
            "📊 You currently have 0 tracked applications."
        )

    status_counter = Counter(
        str(application.get("status") or "Applied")
        for application in applications
    )

    lines = [
        f"📊 You have applied to {count} job(s).",
        "",
        "Application status:",
    ]

    for status, number in status_counter.items():

        lines.append(
            f"• {status}: {number}"
        )

    return "\n".join(lines)


# ============================================================
# RESUME IMPROVEMENT
# ============================================================

def build_resume_improvement_response(
    user_id: int,
) -> str:

    user_skills = get_user_skills(
        user_id=user_id,
    )

    matches = get_best_matches(
        user_id=user_id,
        limit=10,
    )

    # --------------------------------------------------------
    # Collect missing skills from current jobs
    # --------------------------------------------------------

    skill_counter = Counter()

    for match in matches:

        job_skills = {
            skill.lower()
            for skill in match.get(
                "job_skills",
                [],
            )
        }

        missing_skills = (
            job_skills
            - user_skills
        )

        for skill in missing_skills:

            skill_counter[skill] += 1

    # --------------------------------------------------------
    # Start response
    # --------------------------------------------------------

    lines = [
        "📄 Resume Improvement Analysis",
        "",
        "I reviewed your recorded skills against "
        "the current job matches in your account.",
        "",
    ]

    # --------------------------------------------------------
    # Current skills
    # --------------------------------------------------------

    if user_skills:

        formatted_skills = ", ".join(
            skill.title()
            for skill in sorted(user_skills)
        )

        lines.extend(
            [
                "✅ Your current recorded skills:",
                formatted_skills,
                "",
            ]
        )

    else:

        lines.extend(
            [
                "⚠️ No skills are currently recorded "
                "in your profile.",
                "",
                "Add your technical skills to your profile "
                "so the job matching and resume analysis "
                "can become more accurate.",
                "",
            ]
        )

    # --------------------------------------------------------
    # Missing skills
    # --------------------------------------------------------

    if skill_counter:

        top_missing = skill_counter.most_common(
            6
        )

        lines.extend(
            [
                "🎯 Highest-priority skills to consider:",
                "",
            ]
        )

        for index, (skill, count) in enumerate(
            top_missing,
            start=1,
        ):

            lines.append(
                f"{index}. {skill.title()} "
                f"— found in {count} current matched job(s)"
            )

        lines.append("")

    else:

        lines.extend(
            [
                "🎉 Your recorded skills already cover "
                "the skills identified in the current "
                "matched jobs.",
                "",
            ]
        )

    # --------------------------------------------------------
    # Professional summary
    # --------------------------------------------------------

    lines.extend(
        [
            "✍️ Professional Summary",
            "• Target one role instead of using a generic summary.",
            "• Mention your strongest technical skills near the top.",
            "• Mention your AI/ML and software-development strengths.",
            "• Keep the summary concise and achievement-focused.",
            "",
        ]
    )

    # --------------------------------------------------------
    # Projects
    # --------------------------------------------------------

    lines.extend(
        [
            "🚀 Projects",
            "• Start each bullet with a strong action verb.",
            "• Clearly mention the technology you used.",
            "• Explain what you personally implemented.",
            "• Add measurable results where you have genuine numbers.",
            "• Describe the problem, solution and outcome.",
            "",
        ]
    )

    # --------------------------------------------------------
    # ATS
    # --------------------------------------------------------

    lines.extend(
        [
            "🤖 ATS Optimization",
            "• Use keywords that genuinely match the target job.",
            "• Keep technology names consistent throughout the resume.",
            "• Avoid unnecessary graphics, tables and text boxes.",
            "• Keep section headings simple and standard.",
            "",
        ]
    )

    # --------------------------------------------------------
    # Current strongest match
    # --------------------------------------------------------

    if matches:

        best_match = matches[0]

        title = best_match.get(
            "title",
            "target role",
        )

        company = best_match.get(
            "company",
            "company",
        )

        score = best_match.get(
            "match_score",
            0,
        )

        lines.extend(
            [
                "⭐ Current strongest target",
                f"{title} — {company}",
                f"Current match score: {score}%",
                "",
                "Tailor your resume toward this type of role "
                "while keeping every claim truthful.",
            ]
        )

    else:

        lines.extend(
            [
                "⭐ Targeting",
                "No job matches are currently available.",
                "Once jobs are available, this section will "
                "identify the strongest target role.",
            ]
        )

    return "\n".join(lines)


# ============================================================
# HELP RESPONSE
# ============================================================

def build_help_response() -> str:

    return (
        "🤖 I can help you with your job search using "
        "the information already stored in your account.\n\n"
        "Try asking:\n\n"
        "🎯 Which jobs are the best match for me?\n"
        "📄 How can I improve my resume?\n"
        "💡 What skills am I missing?\n"
        "📋 Show my applications\n"
        "📊 How many jobs have I applied to?\n\n"
        "I use your saved profile, skills, jobs and "
        "application data for these answers."
    )


# ============================================================
# MAIN ASSISTANT
# ============================================================

def generate_assistant_response(
    user_id: int,
    conversation_id: int,
    user_message: str,
    job_id: int | None = None,
) -> dict:

    user_message = user_message.strip()

    if not user_message:

        raise ValueError(
            "Message cannot be empty."
        )

    # --------------------------------------------------------
    # Verify conversation ownership
    # --------------------------------------------------------

    conversation_messages = (
        get_conversation_messages(
            user_id=user_id,
            conversation_id=conversation_id,
        )
    )

    # --------------------------------------------------------
    # Save user message
    # --------------------------------------------------------

    add_message(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
    )

    # --------------------------------------------------------
    # Detect intent
    # --------------------------------------------------------

    intent = detect_intent(
        user_message
    )

    # --------------------------------------------------------
    # Generate LOCAL response
    # --------------------------------------------------------

    if intent == "resume":

        assistant_response = (
            build_resume_improvement_response(
                user_id=user_id,
            )
        )

    elif intent == "matches":

        assistant_response = (
            build_best_matches_response(
                user_id=user_id,
            )
        )

    elif intent == "missing_skills":

        assistant_response = (
            build_missing_skills_response(
                user_id=user_id,
            )
        )

    elif intent == "applications":

        assistant_response = (
            build_applications_response(
                user_id=user_id,
            )
        )

    elif intent == "application_count":

        assistant_response = (
            build_application_count_response(
                user_id=user_id,
            )
        )

    else:

        assistant_response = (
            build_help_response()
        )

    # --------------------------------------------------------
    # Save assistant response
    # --------------------------------------------------------

    saved_message = add_message(
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_response,
    )

    # --------------------------------------------------------
    # Return API response
    # --------------------------------------------------------

    return {
        "conversation_id": conversation_id,
        "message": saved_message,
    }