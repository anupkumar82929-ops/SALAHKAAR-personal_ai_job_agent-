from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class RawJob:
    source: str
    external_id: Optional[str]

    title: str
    company: str

    location: Optional[str] = None
    work_mode: Optional[str] = None
    employment_type: Optional[str] = None

    experience_min: Optional[float] = None
    experience_max: Optional[float] = None

    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None

    description: str = ""
    application_url: str = ""

    posted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None