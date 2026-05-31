from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Visal Trivia API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/visal_trivia"
    backend_cors_origins: str = "http://localhost:5173"
    google_client_id: str = ""
    admin_emails: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def admin_email_set(self) -> set[str]:
        return {email.strip().lower() for email in self.admin_emails.split(",") if email.strip()}


settings = Settings()
