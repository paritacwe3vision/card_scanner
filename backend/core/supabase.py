from supabase import create_client, Client

from backend.core.config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_key,
)