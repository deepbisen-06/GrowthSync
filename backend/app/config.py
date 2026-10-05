from typing import List

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: SecretStr = SecretStr("")
    GEMINI_MODEL: str = "gemini-3.6-flash"
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/infosys_deep",
        description="PostgreSQL Connection URL",
    )
    SECRET_KEY: str = Field(
        default="infosys_springboard_secret_key_change_in_production_2026_m1",
        description="Secret key for JWT generation",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    RESET_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes for password reset tokens
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    FRONTEND_URL: str = "http://localhost:5173"

    @model_validator(mode="after")
    def production_configuration(self):
        if self.ENVIRONMENT == "production":
            if len(self.SECRET_KEY) < 32 or "change" in self.SECRET_KEY.lower() or "infosys_springboard_secret" in self.SECRET_KEY:
                raise ValueError("Production requires a unique SECRET_KEY of at least 32 characters.")
            if not self.FRONTEND_URL.startswith("https://"):
                raise ValueError("Production FRONTEND_URL must use HTTPS.")
            if not self.cors_origins or any(not origin.startswith("https://") or "*" in origin for origin in self.cors_origins):
                raise ValueError("Production ALLOWED_ORIGINS must list exact HTTPS origins.")
        return self

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
