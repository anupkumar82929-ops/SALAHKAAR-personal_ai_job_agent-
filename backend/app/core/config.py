from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_host: str
    database_port: int = 5432
    database_name: str
    database_user: str
    database_password: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    job_source_timeout_seconds: int = 30
    job_source_max_results: int = 100

    adzuna_app_id: str | None = None
    adzuna_app_key: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()