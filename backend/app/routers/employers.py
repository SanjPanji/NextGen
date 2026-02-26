# Роутер для работодателей — вакансии и кандидаты
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.middleware.auth import require_role, CurrentUser
from app.db.supabase_client import get_supabase
from app.models.vacancy import VacancyCreate, VacancyUpdate, VacancyResponse
from app.models.match import CandidateMatch
from app.services.matching_service import get_candidates_for_vacancy
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/employers", tags=["Employers"])


def _get_employer_company(user_id: str) -> str:
    """Получает название компании работодателя из profiles."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("profiles")
            .select("organization")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("organization", "") if result.data else ""
    except Exception:
        return ""


# ==============================
# POST /employers/vacancies
# ==============================
@router.post("/vacancies", response_model=VacancyResponse, status_code=status.HTTP_201_CREATED)
async def create_vacancy(
    data: VacancyCreate,
    user: CurrentUser = Depends(require_role("employer")),
):
    """Создаёт новую вакансию работодателя."""
    supabase = get_supabase()
    company = _get_employer_company(user.user_id)
    
    # Автоматически создаём запись работодателя для пользователей, зарегистрированных до добавления триггера
    try:
        supabase.table("employers").upsert(
            {"id": user.user_id, "company_name": company or "Unknown Company"}, 
            on_conflict="id"
        ).execute()
    except Exception as e:
        logger.warning(f"Не удалось обновить запись в таблице employers для {user.user_id}: {e}")
        
    vacancy_data = {
        "employer_id": user.user_id,
        "title": data.title,
        "company": company,
        "description": data.description,
        "required_skills": data.requiredSkills or [],
        "required_technologies": data.requiredTechnologies or [],
        "salary_from": data.salary_from,
        "salary_to": data.salary_to,
        "salary_raw": data.salary,
        "location": data.location,
        "employment_type": data.employment_type,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    try:
        result = supabase.table("vacancies").insert(vacancy_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Ошибка создания вакансии")
        
        saved = result.data[0]
        return VacancyResponse(
            id=saved["id"],
            employerId=user.user_id,
            title=saved["title"],
            company=saved.get("company"),
            description=saved["description"],
            requiredSkills=saved.get("required_skills", []),
            requiredTechnologies=saved.get("required_technologies", []),
            salary=saved.get("salary_raw"),
            salaryFrom=saved.get("salary_from"),
            salaryTo=saved.get("salary_to"),
            location=saved.get("location"),
            employmentType=saved.get("employment_type"),
            isActive=saved.get("is_active", True),
            status="active",
            createdAt=saved.get("created_at"),
            candidatesCount=0
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания вакансии: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


# ==============================
# GET /employers/vacancies
# ==============================
@router.get("/vacancies", response_model=list[VacancyResponse])
async def list_vacancies(
    active_only: bool = Query(default=False, description="Только активные вакансии"),
    user: CurrentUser = Depends(require_role("employer")),
):
    """Возвращает все вакансии текущего работодателя."""
    supabase = get_supabase()
    
    try:
        query = (
            supabase.table("vacancies")
            .select("*")
            .eq("employer_id", user.user_id)
            .order("created_at", desc=True)
        )
        
        if active_only:
            query = query.eq("is_active", True)
        
        result = query.execute()
        vacancies = result.data or []
        
        return [
            VacancyResponse(
                id=v["id"],
                employerId=user.user_id,
                title=v["title"],
                company=v.get("company"),
                description=v["description"],
                requiredSkills=v.get("required_skills", []),
                requiredTechnologies=v.get("required_technologies", []),
                salary=v.get("salary_raw"),
                salaryFrom=v.get("salary_from"),
                salaryTo=v.get("salary_to"),
                location=v.get("location"),
                employmentType=v.get("employment_type"),
                isActive=v.get("is_active", True),
                status="active" if v.get("is_active", True) else "closed",
                createdAt=v.get("created_at"),
            )
            for v in vacancies
        ]
    except Exception as e:
        logger.error(f"Ошибка получения вакансий работодателя {user.user_id}: {e}")
        raise HTTPException(status_code=500, detail="Ошибка загрузки вакансий")


# ==============================
# PUT /employers/vacancies/{id}
# ==============================
@router.put("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(
    vacancy_id: str,
    data: VacancyUpdate,
    user: CurrentUser = Depends(require_role("employer")),
):
    """Обновляет вакансию."""
    supabase = get_supabase()
    
    raw_data = data.model_dump(exclude_none=True)
    update_data = {}
    for k, v in raw_data.items():
        if k == "requiredSkills": update_data["required_skills"] = v
        elif k == "requiredTechnologies": update_data["required_technologies"] = v
        elif k == "salary": update_data["salary_raw"] = v
        else: update_data[k] = v
    
    try:
        result = (
            supabase.table("vacancies")
            .update(update_data)
            .eq("id", vacancy_id)
            .eq("employer_id", user.user_id) # Безопасность
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Вакансия не найдена или нет прав")
        
        v = result.data[0]
        return VacancyResponse(
            id=v["id"],
            employerId=user.user_id,
            title=v["title"],
            company=v.get("company"),
            description=v["description"],
            requiredSkills=v.get("required_skills", []),
            requiredTechnologies=v.get("required_technologies", []),
            salary=v.get("salary_raw"),
            salaryFrom=v.get("salary_from"),
            salaryTo=v.get("salary_to"),
            location=v.get("location"),
            employmentType=v.get("employment_type"),
            isActive=v.get("is_active", True),
            status="active" if v.get("is_active", True) else "closed",
            createdAt=v.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления вакансии {vacancy_id}: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


# ==============================
# GET /employers/vacancies/{id}/candidates
# ==============================
@router.get("/vacancies/{vacancy_id}/candidates", response_model=list[CandidateMatch])
async def get_candidates(
    vacancy_id: str,
    min_percent: int = Query(default=0, ge=0, le=100, description="Минимальный % совпадения"),
    user: CurrentUser = Depends(require_role("employer")),
):
    """
    Возвращает кандидатов для вакансии, отсортированных по % матчинга.
    Использует AI Gemini для анализа каждого студента с кешированием.
    """
    supabase = get_supabase()
    
    # Проверяем что вакансия принадлежит этому работодателю
    try:
        vac_result = (
            supabase.table("vacancies")
            .select("*")
            .eq("id", vacancy_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    
    if not vac_result.data:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    
    vacancy = vac_result.data
    if vacancy.get("employer_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой вакансии")
    
    candidates = await get_candidates_for_vacancy(vacancy_id, vacancy)
    
    # Фильтрация по минимальному проценту
    filtered = [c for c in candidates if c.get("match_percent", 0) >= min_percent]
    
    return [
        CandidateMatch(
            student_id=c["student_id"],
            name=c["name"],
            university=c["university"],
            specialty=c["specialty"],
            matchPercent=c["match_percent"],
            matchingSkills=c["strong_skills"],
            missingSkills=c["missing_skills"],
            githubUrl=c.get("github_url"),
            resumeUrl=c.get("resume_url"),
            email=c.get("email"),
        )
        for c in filtered
    ]
