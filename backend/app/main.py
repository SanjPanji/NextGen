# Главный файл FastAPI приложения — точка входа
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import students, employers, analytics

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
# Убираем шумные DEBUG-логи от сетевых библиотек
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("hpack").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Событие жизненного цикла приложения."""
    logger.info("🚀 CareerAI Backend запускается...")
    logger.info(f"   Supabase URL: {settings.supabase_url[:40]}...")
    logger.info(f"   Gemini API: {'✓ настроен' if settings.gemini_api_key else '✗ не настроен'}")
    logger.info(f"   Groq API: {'✓ настроен' if settings.groq_api_key else '✗ не настроен'}")
    logger.info(f"   GitHub Token: {'✓ настроен' if settings.github_token else '⚠ не указан (rate limit 60/час)'}")
    logger.info(f"   Debug режим: {'включён' if settings.debug else 'выключен'}")
    yield
    logger.info("👋 CareerAI Backend остановлен")


# Создаём FastAPI приложение
app = FastAPI(
    title="CareerAI Backend",
    description="""
## AI-сервис карьерного матчинга студентов и работодателей

### Основные возможности:
- 🎓 Профиль студента с AI анализом GitHub и PDF резюме
- 🤖 Матчинг через Google Gemini 1.5 Flash с 24-часовым кешем
- 📊 Быстрое парсинг резюме через Groq (llama-3.3-70b)
- 🏢 Управление вакансиями для работодателей
- 📈 Аналитика трудоустройства для университетов

### Аутентификация:
Все эндпоинты требуют Bearer токен Supabase в заголовке:
```
Authorization: Bearer <supabase-jwt-token>
```
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ==============================
# CORS Middleware
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# Роутеры
# ==============================
app.include_router(students.router)
app.include_router(employers.router)
app.include_router(analytics.router)


# ==============================
# Системные эндпоинты
# ==============================

@app.get("/", include_in_schema=False)
async def root():
    """Корневой эндпоинт — проверка работоспособности."""
    return {"service": "CareerAI Backend", "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["System"])
async def health_check():
    """Health check для мониторинга и деплоя."""
    from app.db.supabase_client import get_supabase
    
    checks = {
        "api": "ok",
        "supabase": "unknown",
        "gemini": "configured" if settings.gemini_api_key else "not_configured",
        "groq": "configured" if settings.groq_api_key else "not_configured",
    }
    
    # Проверяем соединение с Supabase
    try:
        supabase = get_supabase()
        supabase.table("vacancies").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except Exception as e:
        checks["supabase"] = f"error: {str(e)[:50]}"
    
    status = "healthy" if all(v in ("ok", "configured") for v in checks.values()) else "degraded"
    
    return JSONResponse(
        content={"status": status, "checks": checks},
        status_code=200 if status == "healthy" else 503,
    )


# ==============================
# Запуск (для разработки)
# ==============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
