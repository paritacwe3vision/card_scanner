from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str

    openrouter_api_key: str
    openrouter_vlm_model: str = "google/gemini-2.5-flash"

    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()