from abc import ABC, abstractmethod

from app.jobs.schemas import RawJob


class JobSource(ABC):

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the unique source name."""
        raise NotImplementedError

    @abstractmethod
    def fetch_jobs(self) -> list[RawJob]:
        """Fetch jobs from the source."""
        raise NotImplementedError