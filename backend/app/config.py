# Конфигурация приложения через pydantic-settings
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Настройки приложения из переменных окружения."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Supabase
    supabase_url: str = "https://uwbancqnqoqdnhksgprg.supabase.co"
    supabase_service_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3YmFuY3FucW9xZG5oa3NncHJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2OTA1NywiZXhwIjoyMDg3NTQ1MDU3fQ.IsWmTb0DxCKz0pbN5kI5Ac9rMvsYR1zNITrwZ44yZ7k"

    # AI APIs
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # GitHub (опционально)
    github_token: str = ""

    # JWT (секрет из Supabase → Settings → API → JWT Secret)
    jwt_secret: str = "1376e5ef-48b5-4b8f-accc-a393051e6938"

    # Сервер
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True

    # Кеш матчинга (в часах)
    match_cache_hours: int = 24

    # CORS — разрешённые домены фронтенда
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-frontend.vercel.app",
    ]


@lru_cache()
def get_settings() -> Settings:
    """Синглтон настроек — кешируется после первого вызова."""
    return Settings()


# Удобный алиас для импорта
settings = get_settings()
