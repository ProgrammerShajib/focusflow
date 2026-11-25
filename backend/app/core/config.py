from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """All configuration comes from environment variables (12-factor style).
    Same code runs on your laptop and in production; only the .env differs."""
    model_config = SettingsConfigDict(env_file=".env")
    database_url: str = "sqlite:///./focusflow.db"
    secret_key: str = "dev-only-change-me"
    access_token_minutes: int = 60 * 24 * 7
    cors_origins: list[str] = ["http://localhost:5173"]

settings = Settings()
