# Сервис матчинга — кеш в Supabase + бизнес логика
import logging
from datetime import datetime, timezone, timedelta
from app.db.supabase_client import get_supabase
from app.services.gemini_service import analyze_match_with_gemini
from app.config import settings

logger = logging.getLogger(__name__)


async def get_or_create_matches(student_id: str, student_profile: dict) -> list[dict]:
    """
    Получает матчи студента с вакансиями.
    
    Алгоритм кеширования:
    1. Проверяем существующие матчи в таблице matches
    2. Если cached_at > 24 часов назад — возвращаем кеш
    3. Если кеша нет или устарел — вызываем Gemini и кешируем
    
    Args:
        student_id: ID студента
        student_profile: Профиль студента (навыки и т.д.)
        
    Returns:
        Список матчей, отсортированный по убыванию match_percent
    """
    supabase = get_supabase()
    cache_cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.match_cache_hours)
    
    # Проверяем кеш — берём матчи студента не старше 24 часов
    try:
        cached = (
            supabase.table("matches")
            .select("*, vacancies(title, company, description, required_skills, required_technologies, salary_from, salary_to, location, employment_type)")
            .eq("student_id", student_id)
            .gte("cached_at", cache_cutoff.isoformat())
            .order("match_percent", desc=True)
            .limit(20)
            .execute()
        )
        
        if cached.data and len(cached.data) > 0:
            logger.info(f"Кеш матчинга для студента {student_id}: {len(cached.data)} вакансий")
            return _format_cached_matches(cached.data)
            
    except Exception as e:
        logger.warning(f"Ошибка чтения кеша матчинга: {e}")
    
    # Кеша нет — получаем активные вакансии и считаем матчинг
    logger.info(f"Вычисляем новый матчинг для студента {student_id}")
    
    try:
        vacancies_result = (
            supabase.table("vacancies")
            .select("*")
            .eq("is_active", True)
            .limit(50)
            .execute()
        )
        vacancies = vacancies_result.data or []
    except Exception as e:
        logger.error(f"Ошибка получения вакансий: {e}")
        return []
    
    if not vacancies:
        return []
    
    # Считаем матчинг через Gemini для каждой вакансии
    matches = []
    for vacancy in vacancies:
        try:
            match_data = await analyze_match_with_gemini(student_profile, vacancy)
            
            match_record = {
                "student_id": student_id,
                "vacancy_id": vacancy["id"],
                "match_percent": match_data["match_percent"],
                "strong_skills": match_data.get("strong_skills", []),
                "missing_skills": match_data.get("missing_skills", []),
                "explanation": match_data.get("explanation", ""),
                "cached_at": datetime.now(timezone.utc).isoformat(),
            }
            
            # Кешируем в Supabase
            supabase.table("matches").upsert(
                match_record,
                on_conflict="student_id,vacancy_id"
            ).execute()
            
            # Формируем результат для ответа
            matches.append({
                **match_record,
                "vacancy_title": vacancy.get("title", ""),
                "company": vacancy.get("company", ""),
                "salary_from": vacancy.get("salary_from"),
                "salary_to": vacancy.get("salary_to"),
                "location": vacancy.get("location"),
                "employment_type": vacancy.get("employment_type"),
            })
            
        except Exception as e:
            logger.warning(f"Ошибка матчинга с вакансией {vacancy.get('id')}: {e}")
            continue
    
    # Сортируем по проценту совпадения
    matches.sort(key=lambda x: x["match_percent"], reverse=True)
    logger.info(f"Матчинг завершён: {len(matches)} вакансий для студента {student_id}")
    return matches[:20]


async def get_candidates_for_vacancy(vacancy_id: str, vacancy: dict) -> list[dict]:
    """
    Находит и ранжирует кандидатов для конкретной вакансии.
    
    Args:
        vacancy_id: ID вакансии
        vacancy: Данные вакансии
        
    Returns:
        Список кандидатов, отсортированный по match_percent
    """
    supabase = get_supabase()
    
    try:
        # Берём все профили студентов
        students_result = (
            supabase.table("students")
            .select("*, profiles(name, organization)")
            .limit(100)
            .execute()
        )
        students = students_result.data or []
    except Exception as e:
        logger.error(f"Ошибка получения студентов: {e}")
        return []
    
    candidates = []
    for student in students:
        try:
            # Проверяем кеш для этого студента × вакансии
            cache_cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.match_cache_hours)
            cached = (
                supabase.table("matches")
                .select("*")
                .eq("student_id", student["id"])
                .eq("vacancy_id", vacancy_id)
                .gte("cached_at", cache_cutoff.isoformat())
                .single()
                .execute()
            )
            
            if cached.data:
                match_data = cached.data
            else:
                # Вычисляем через Gemini
                match_data = await analyze_match_with_gemini(student, vacancy)
                # Кешируем
                supabase.table("matches").upsert({
                    "student_id": student["id"],
                    "vacancy_id": vacancy_id,
                    "match_percent": match_data["match_percent"],
                    "strong_skills": match_data.get("strong_skills", []),
                    "missing_skills": match_data.get("missing_skills", []),
                    "explanation": match_data.get("explanation", ""),
                    "cached_at": datetime.now(timezone.utc).isoformat(),
                }, on_conflict="student_id,vacancy_id").execute()
            
            candidates.append({
                "student_id": student["id"],
                "name": student.get("profiles", {}).get("name") or "",
                "university": "", # Необязательно теперь
                "specialty": "",
                "match_percent": match_data.get("match_percent", 0),
                "strong_skills": match_data.get("strong_skills", []),
                "missing_skills": match_data.get("missing_skills", []),
                "github_url": None,
                "resume_url": None,
                "email": None,
            })
            
        except Exception as e:
            logger.warning(f"Ошибка матчинга кандидата {student.get('id')}: {e}")
            continue
    
    candidates.sort(key=lambda x: x["match_percent"], reverse=True)
    return candidates


def _format_cached_matches(raw: list[dict]) -> list[dict]:
    """Форматирует кешированные матчи из Supabase для ответа API."""
    result = []
    for item in raw:
        vacancy = item.get("vacancies") or {}
        result.append({
            "vacancy_id": item.get("vacancy_id", ""),
            "vacancy_title": vacancy.get("title", "") if isinstance(vacancy, dict) else "",
            "company": vacancy.get("company", "") if isinstance(vacancy, dict) else "",
            "match_percent": item.get("match_percent", 0),
            "strong_skills": item.get("strong_skills", []),
            "missing_skills": item.get("missing_skills", []),
            "explanation": item.get("explanation", ""),
            "salary_from": vacancy.get("salary_from") if isinstance(vacancy, dict) else None,
            "salary_to": vacancy.get("salary_to") if isinstance(vacancy, dict) else None,
            "location": vacancy.get("location") if isinstance(vacancy, dict) else None,
            "employment_type": vacancy.get("employment_type") if isinstance(vacancy, dict) else None,
            "cached_at": item.get("cached_at"),
        })
    return result


async def save_skill_history(student_id: str, skills_dict: dict) -> None:
    """
    Сохраняет снапшот навыков студента в таблицу skill_history.
    """
    supabase = get_supabase()
    try:
        all_skills = list(skills_dict.get("hard_skills", [])) + list(skills_dict.get("soft_skills", []))
        supabase.table("skill_history").insert({
            "student_id": student_id,
            "skills": all_skills,
            "snapshot_date": datetime.now(timezone.utc).date().isoformat(),
        }).execute()
        logger.info(f"Снапшот навыков сохранён для студента {student_id}")
    except Exception as e:
        logger.warning(f"Не удалось сохранить skill_history: {e}")
