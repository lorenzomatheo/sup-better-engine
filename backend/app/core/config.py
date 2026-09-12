"""Application configuration — loaded from environment variables / .env file."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration for the backend application.

    Values are read from environment variables, with fallback to .env file.
    """

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Application ---
    app_env: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # --- Database ---
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sup_better_engine"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/sup_better_engine"

    # --- JWT / Auth ---
    secret_key: str = "change-me-to-random-64-char-string"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 8

    # --- CORS ---
    cors_origins: list[str] = ["http://localhost:3000"]

    # --- LLM ---
    classifier_mode: str = "stub"  # "stub" or "llm"
    llm_provider: str = "openai"
    openai_api_key: str = "sk-placeholder"
    openai_model: str = "gpt-4o-mini"

    # --- Operational Parameters (provisórios — revisão semana 2) ---
    session_ttl_hours: int = 24
    rate_limit_per_ip_per_hour: int = 30
    turn_limit_per_session: int = 40
    email_modal_trigger_turn: int = 4
    email_modal_max_displays: int = 2


settings = Settings()
