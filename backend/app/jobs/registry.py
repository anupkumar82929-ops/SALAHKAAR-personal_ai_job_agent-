from app.jobs.base import JobSource


class JobSourceRegistry:
    def __init__(self):
        self._sources: dict[str, JobSource] = {}

    def register(self, source: JobSource) -> None:
        source_name = source.name.strip().lower()

        if not source_name:
            raise ValueError("Job source name cannot be empty.")

        if source_name in self._sources:
            raise ValueError(
                f"Job source '{source_name}' is already registered."
            )

        self._sources[source_name] = source

    def get(self, source_name: str) -> JobSource:
        key = source_name.strip().lower()

        if key not in self._sources:
            raise KeyError(
                f"Job source '{source_name}' is not registered."
            )

        return self._sources[key]

    def list_sources(self) -> list[str]:
        return sorted(self._sources.keys())