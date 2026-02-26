# JWT аутентификация — проверка токенов Supabase
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.db.supabase_client import get_supabase
import logging

logger = logging.getLogger(__name__)

# Bearer токен из заголовка Authorization
security = HTTPBearer()


class CurrentUser:
    """Данные авторизованного пользователя."""
    def __init__(self, user_id: str, email: str, role: str):
        self.user_id = user_id
        self.email = email
        self.role = role


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> CurrentUser:
    """
    Проверяет JWT токен Supabase.
    
    Алгоритм:
    1. Декодирует токен через JWT_SECRET
    2. Получает user_id из payload (sub)
    3. Запрашивает роль пользователя из таблицы profiles
    4. Возвращает CurrentUser объект
    """
    token = credentials.credentials
    supabase = get_supabase()
    
    try:
        # Используем встроенный метод Supabase для проверки токена.
        # Это избавляет от проблем с алгоритмами (HS256 vs ES256) и секретными ключами.
        user_res = supabase.auth.get_user(token)
        user = user_res.user
        
        if not user:
            raise HTTPException(status_code=401, detail="Недействительный токен")
            
        user_id = user.id
        email = user.email or ""
        # Роль из метаданных (быстрый доступ)
        role = user.user_metadata.get("role", "student") if user.user_metadata else "student"
        
    except Exception as e:
        logger.warning(f"Ошибка проверки токена через Supabase API: {e}")
        raise HTTPException(
            status_code=401,
            detail="Недействительный или истёкший токен авторизации",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Для надежности пытаемся получить актуальную роль из таблицы profiles
    try:
        profile_res = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
        if profile_res.data:
            role = profile_res.data.get("role", role)
        else:
            # Профиль не найден — создаём минимальную запись (первый вход)
            logger.info(f"Профиль не найден для {user_id}, создаём запись...")
            try:
                supabase.table("profiles").upsert({
                    "id": user_id,
                    "name": email.split("@")[0],
                    "role": role,
                }, on_conflict="id").execute()
            except Exception as create_err:
                logger.warning(f"Не удалось создать профиль для {user_id}: {create_err}")
    except Exception as e:
        if "PGRST116" in str(e) or "0 rows" in str(e):
            # Профиль не существует — создаём
            logger.info(f"Профиль отсутствует в таблице profiles для {user_id}. Создаём...")
            try:
                supabase.table("profiles").upsert({
                    "id": user_id,
                    "name": email.split("@")[0],
                    "role": role,
                }, on_conflict="id").execute()
            except Exception as create_err:
                logger.warning(f"Не удалось создать профиль для {user_id}: {create_err}")
        else:
            logger.debug(f"Не удалось уточнить роль в БД для {user_id} (используем JWT): {e}")
    
    return CurrentUser(user_id=user_id, email=email, role=role)


def require_role(*allowed_roles: str):
    """
    Декоратор-фабрика для проверки роли пользователя.
    
    Использование:
        @router.get("/")
        async def endpoint(user=Depends(require_role("employer"))):
            ...
    """
    async def role_checker(user: CurrentUser = Depends(verify_token)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Доступ запрещён. Требуемая роль: {', '.join(allowed_roles)}",
            )
        return user
    return role_checker
