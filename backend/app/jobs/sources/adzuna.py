from app.core.config import settings
from app.jobs.base import JobSource
from app.jobs.http_client import JobSourceHTTPClient
from app.jobs.schemas import RawJob


class AdzunaSource(JobSource):

    def __init__(self):
        self.client = JobSourceHTTPClient()

    @property
    def name(self) -> str:
        return "adzuna"

    def fetch_jobs(
        self,
        country: str = "in",
        page: int = 1,
        what: str = "software engineer",
        where: str | None = None,
        results_per_page: int = 20,
    ) -> list[RawJob]:

        if not settings.adzuna_app_id:
            raise RuntimeError(
                "ADZUNA_APP_ID is not configured."
            )

        if not settings.adzuna_app_key:
            raise RuntimeError(
                "ADZUNA_APP_KEY is not configured."
            )

        url = (
            f"https://api.adzuna.com/v1/api/"
            f"jobs/{country}/search/{page}"
        )

        params = {
            "app_id": settings.adzuna_app_id,
            "app_key": settings.adzuna_app_key,
            "results_per_page": str(results_per_page),
            "what": what,
            "content-type": "application/json",
        }

        if where:
            params["where"] = where

        response = self.client.get(
            url,
            params=params,
        )

        data = response.json()

        jobs = []

        for item in data.get("results", []):

            company = item.get("company") or {}

            location = item.get("location") or {}

            jobs.append(
                RawJob(
                    source=self.name,
                    external_id=str(item["id"])
                    if item.get("id") is not None
                    else None,

                    title=item.get("title", "").strip(),

                    company=company.get(
                        "display_name",
                        ""
                    ).strip(),

                    location=location.get(
                        "display_name"
                    ),

                    employment_type=item.get(
                        "contract_type"
                    ),

                    salary_min=item.get(
                        "salary_min"
                    ),

                    salary_max=item.get(
                        "salary_max"
                    ),

                    description=item.get(
                        "description",
                        ""
                    ),

                    application_url=item.get(
                        "redirect_url",
                        ""
                    ),
                )
            )

        return jobs