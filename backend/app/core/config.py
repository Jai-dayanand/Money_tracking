from functools import lru_cache
from pathlib import Path
import tempfile

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="MONEY_TRACKING_",
        extra="ignore"
    )

    app_name: str = "Money Tracking API"
    environment: str = "development"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    db_path: str = Field(default_factory=lambda: str(Path(tempfile.gettempdir()) / "money_tracking.db"))
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
