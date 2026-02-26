# Роутер аналитики для университетов
import logging
from fastapi import APIRouter, Depends, Query
from app.middleware.auth import require_role, CurrentUser
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


# ==============================
# GET /analytics/top-skills
# ==============================
@router.get("/top-skills")
async def get_top_skills(
    limit: int = Query(default=15, ge=5, le=50, description="Количество навыков"),
    user: CurrentUser = Depends(require_role("university")),
):
    """
    Возвращает топ востребованных навыков на рынке труда
    на основе анализа всех активных вакансий.
    """
    supabase = get_supabase()
    
    try:
        vacancies_result = (
            supabase.table("vacancies")
            .select("requirements")
            .eq("is_active", True)
            .execute()
        )
        
        # Подсчёт частоты каждого навыка
        skill_count: dict[str, int] = {}
        total_vacancies = len(vacancies_result.data or [])
        
        for v in (vacancies_result.data or []):
            reqs = v.get("requirements") or {}
            all_skills = (reqs.get("required_skills") or []) + (reqs.get("required_technologies") or [])
            for skill in all_skills:
                skill = skill.strip()
                if skill:
                    skill_count[skill] = skill_count.get(skill, 0) + 1
        
        # Конвертируем в проценты
        top_skills = [
            {
                "skill": skill,
                "demand": round(count / max(total_vacancies, 1) * 100),
                "count": count,
            }
            for skill, count in sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:limit]
        ]
        
        return {
            "top_skills": top_skills,
            "total_vacancies_analyzed": total_vacancies,
        }
        
    except Exception as e:
        logger.error(f"Ошибка анализа топ навыков: {e}")
        # Возвращаем mock данные если БД недоступна
        return {
            "top_skills": _mock_top_skills()[:limit],
            "total_vacancies_analyzed": 0,
        }


# ==============================
# GET /analytics/readiness
# ==============================
@router.get("/readiness")
async def get_readiness(
    user: CurrentUser = Depends(require_role("university")),
):
    """
    Возвращает распределение студентов по уровню готовности к работе
    на основе процента матчинга с вакансиями.
    """
    supabase = get_supabase()
    
    try:
        # Берём все матчи и считаем средний % для каждого студента
        matches_result = (
            supabase.table("matches")
            .select("student_id, match_percent")
            .execute()
        )
        
        # Группируем по студентам
        student_matches: dict[str, list[int]] = {}
        for m in (matches_result.data or []):
            sid = m["student_id"]
            student_matches.setdefault(sid, []).append(m["match_percent"])
        
        # Средний % для каждого студента
        avg_matches = [
            round(sum(percs) / len(percs))
            for percs in student_matches.values()
        ]
        
        total = max(len(avg_matches), 1)
        
        # Готов (≥75%), Хорошо (50-74%), Развивается (25-49%), Начинающий (<25%)
        ready = len([p for p in avg_matches if p >= 75])
        good = len([p for p in avg_matches if 50 <= p < 75])
        growing = len([p for p in avg_matches if 25 <= p < 50])
        beginner = len([p for p in avg_matches if p < 25])
        
        # Подсчёт студентов
        students_count_result = (
            supabase.table("students")
            .select("id", count="exact")
            .execute()
        )
        total_students = students_count_result.count or len(avg_matches)
        
        # Средний матчинг
        avg_match_rate = round(sum(avg_matches) / total) if avg_matches else 0
        
        return {
            "total_students": total_students,
            "avg_match_rate": avg_match_rate,
            "employed_students": ready,  # % готовых к работе как "трудоустроенных"
            "readiness_distribution": [
                {"label": "Готовы к работе", "value": round(ready / total * 100), "color": "#10b981"},
                {"label": "Хорошая база", "value": round(good / total * 100), "color": "#6366f1"},
                {"label": "В процессе", "value": round(growing / total * 100), "color": "#f59e0b"},
                {"label": "Начинающие", "value": round(beginner / total * 100), "color": "#ef4444"},
            ],
        }
        
    except Exception as e:
        logger.error(f"Ошибка аналитики готовности: {e}")
        return _mock_readiness()


# ==============================
# GET /analytics/trends
# ==============================
@router.get("/trends")
async def get_trends(
    months: int = Query(default=6, ge=1, le=12, description="За сколько месяцев"),
    user: CurrentUser = Depends(require_role("university")),
):
    """
    Возвращает динамику роста навыков студентов по месяцам
    из таблицы skill_history.
    """
    supabase = get_supabase()
    
    try:
        history_result = (
            supabase.table("skill_history")
            .select("student_id, skills, snapshot_date")
            .order("snapshot_date")
            .execute()
        )
        
        if not history_result.data:
            return {"trends": _mock_trends(months)}
        
        # Группируем по месяцам
        from datetime import datetime
        from collections import defaultdict
        
        monthly: dict[str, list] = defaultdict(list)
        
        for record in history_result.data:
            try:
                dt = datetime.strptime(record["snapshot_date"], "%Y-%m-%d")
                month_key = dt.strftime("%b %Y")
                monthly[month_key].append(len(record.get("skills") or []))
            except Exception:
                continue
        
        # Берём последние N месяцев
        recent_months = list(monthly.keys())[-months:]
        
        # Параллельно получаем средний матчинг по месяцам
        matches_result = (
            supabase.table("matches")
            .select("match_percent, cached_at")
            .execute()
        )
        
        monthly_match: dict[str, list] = defaultdict(list)
        for m in (matches_result.data or []):
            try:
                cached = m.get("cached_at", "")
                dt = datetime.fromisoformat(cached.replace("Z", "+00:00"))
                month_key = dt.strftime("%b %Y")
                monthly_match[month_key].append(m["match_percent"])
            except Exception:
                continue
        
        trends = []
        for month in recent_months:
            skills_list = monthly.get(month, [0])
            match_list = monthly_match.get(month, [0])
            trends.append({
                "month": month,
                "avg_skills": round(sum(skills_list) / len(skills_list), 1),
                "avg_match": round(sum(match_list) / len(match_list)) if match_list else 0,
                "students_count": len(skills_list),
            })
        
        return {"trends": trends}
        
    except Exception as e:
        logger.error(f"Ошибка аналитики трендов: {e}")
        return {"trends": _mock_trends(months)}


@router.get("/employer-stats")
async def get_employer_stats(
    user: CurrentUser = Depends(require_role("employer")),
):
    """
    Возвращает статистику для дашборда работодателя.
    Кол-во активных вакансий, общее число подходящих кандидатов и ср. матчинг.
    """
    supabase = get_supabase()
    
    try:
        # 1. Получаем ID всех вакансий этого работодателя
        vac_res = (
            supabase.table("vacancies")
            .select("id, is_active")
            .eq("employer_id", user.user_id)
            .execute()
        )
        
        vacancies = vac_res.data or []
        active_vac_ids = [v["id"] for v in vacancies if v.get("is_active")]
        
        # 2. Получаем матчи для этих вакансий
        if not active_vac_ids:
            return {
                "activeVacancies": 0,
                "totalCandidates": 0,
                "avgMatchRate": 0,
                "recentMatches": [],
            }
        
        matches_res = (
            supabase.table("matches")
            .select("match_percent, student_id")
            .in_("vacancy_id", active_vac_ids)
            .order("match_percent", desc=True)
            .execute()
        )
        
        matches = matches_res.data or []
        total_candidates = len(set(m["student_id"] for m in matches)) # Уникальные студенты
        avg_match = round(sum(m["match_percent"] for m in matches) / len(matches)) if matches else 0
        
        return {
            "activeVacancies": len(active_vac_ids),
            "totalCandidates": total_candidates,
            "avgMatchRate": avg_match,
            "recentMatches": matches[:5], # Топ 5 совпадений
        }
        
    except Exception as e:
        logger.error(f"Ошибка получения статистики работодателя: {e}")
        return {
            "activeVacancies": 0,
            "totalCandidates": 0,
            "avgMatchRate": 0,
            "recentMatches": [],
        }


@router.get("/summary")
async def get_summary(
    user: CurrentUser = Depends(require_role("university")),
):
    """
    Агрегированный эндпоинт для дашборда университета.
    Собирает данные из всех аналитических модулей.
    """
    try:
        # 1. Получаем топ навыков (базово 10)
        skills_data = await get_top_skills(limit=10, user=user)
        
        # 2. Получаем готовность и общее кол-во
        readiness_data = await get_readiness(user=user)
        
        # 3. Получаем тренды
        trends_data = await get_trends(months=6, user=user)
        
        # Маппим тренды в camelCase для фронтенда
        trends = []
        for t in trends_data.get("trends", []):
            trends.append({
                "month": t.get("month"),
                "avgSkills": t.get("avg_skills", 0),
                "avgMatch": t.get("avg_match", 0),
                "studentsCount": t.get("students_count", 0),
            })

        total = readiness_data.get("total_students", 1) or 1
        ready_count = readiness_data.get("employed_students", 0)
        employed_percent = round(ready_count / total * 100)
        
        return {
            "topSkills": skills_data.get("top_skills", []),
            "readinessDistribution": readiness_data.get("readiness_distribution", []),
            "skillsGrowth": trends,
            "totalStudents": readiness_data.get("total_students", 0),
            "avgMatchRate": readiness_data.get("avg_match_rate", 0),
            "employedStudents": employed_percent,
        }
    except Exception as e:
        logger.error(f"Ошибка сбора сводной аналитики: {e}")
        # Fallback на смешанные моки
        readiness = _mock_readiness()
        return {
            "topSkills": _mock_top_skills()[:10],
            "readinessDistribution": readiness["readiness_distribution"],
            "skillsGrowth": _mock_trends(6),
            "totalStudents": readiness["total_students"],
            "avgMatchRate": readiness["avg_match_rate"],
            "employedStudents": readiness["employed_students"],
        }


# ==============================
# Mock данные (fallback)
# ==============================

def _mock_top_skills() -> list[dict]:
    return [
        {"skill": "Python", "demand": 85, "count": 42},
        {"skill": "React", "demand": 78, "count": 39},
        {"skill": "TypeScript", "demand": 72, "count": 36},
        {"skill": "Docker", "demand": 68, "count": 34},
        {"skill": "PostgreSQL", "demand": 65, "count": 32},
        {"skill": "FastAPI", "demand": 58, "count": 29},
        {"skill": "Git", "demand": 95, "count": 47},
        {"skill": "REST API", "demand": 80, "count": 40},
        {"skill": "SQL", "demand": 70, "count": 35},
        {"skill": "Linux", "demand": 55, "count": 27},
    ]


def _mock_readiness() -> dict:
    return {
        "total_students": 850,
        "avg_match_rate": 54,
        "employed_students": 68,
        "readiness_distribution": [
            {"label": "Готовы к работе", "value": 32, "color": "#10b981"},
            {"label": "Хорошая база", "value": 38, "color": "#6366f1"},
            {"label": "В процессе", "value": 22, "color": "#f59e0b"},
            {"label": "Начинающие", "value": 8, "color": "#ef4444"},
        ],
    }


def _mock_trends(months: int) -> list[dict]:
    import calendar
    from datetime import datetime, timedelta
    trends = []
    base_date = datetime.now()
    for i in range(months - 1, -1, -1):
        dt = base_date - timedelta(days=30 * i)
        trends.append({
            "month": dt.strftime("%b %Y"),
            "avg_skills": 6.5 + i * 0.3,
            "avg_match": 42 + i * 3,
            "students_count": 800 + i * 10,
        })
    return trends
