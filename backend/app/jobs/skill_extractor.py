import re


KNOWN_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "c",
    "c++",
    "c#",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "html",
    "css",
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "fastapi",
    "flask",
    "django",
    "spring",
    "spring boot",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "linux",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "pandas",
    "numpy",
    "opencv",
    "machine learning",
    "deep learning",
    "data science",
    "data analysis",
    "artificial intelligence",
    "rest api",
    "graphql",
    "microservices",
]


def extract_skills(text: str) -> list[str]:
    if not text:
        return []

    normalized_text = text.lower()
    found_skills = set()

    for skill in KNOWN_SKILLS:
        escaped_skill = re.escape(skill)

        pattern = rf"(?<!\w){escaped_skill}(?!\w)"

        if re.search(pattern, normalized_text):
            found_skills.add(skill)

    return sorted(found_skills)