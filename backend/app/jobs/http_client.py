import httpx

from app.core.config import settings


class JobSourceHTTPClient:
    """
    Shared HTTP client for external job sources.

    Source-specific authentication and API logic should
    remain inside the individual source connector.
    """

    def __init__(self):
        self.timeout = settings.job_source_timeout_seconds

    def get(
        self,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        params: dict[str, str] | None = None,
    ) -> httpx.Response:

        try:
            with httpx.Client(
                timeout=self.timeout,
                follow_redirects=True,
            ) as client:

                response = client.get(
                    url,
                    headers=headers,
                    params=params,
                )

                response.raise_for_status()

                return response

        except httpx.TimeoutException as error:
            raise RuntimeError(
                "Job source request timed out."
            ) from error

        except httpx.HTTPStatusError as error:
            raise RuntimeError(
                f"Job source returned HTTP {error.response.status_code}."
            ) from error

        except httpx.RequestError as error:
            raise RuntimeError(
                f"Unable to reach job source: {error}"
            ) from error