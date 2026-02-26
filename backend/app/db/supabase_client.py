# Supabase клиент — используется для работы с БД
from supabase import create_client, Client
from app.config import settings

# Синглтон клиента Supabase с service role key
# (service key обходит RLS — нужен для серверных операций)
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Возвращает синглтон Supabase клиента."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_key,
        )
    return _supabase_client
