# Роутер для студентов — профиль, матчинг, рекомендации
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.middleware.auth import verify_token, require_role, CurrentUser
from app.db.supabase_client import get_supabase
from app.models.student import StudentProfileCreate, StudentProfileResponse, GitHubConnectRequest, GitHubAnalysisResponse
from app.models.match import MatchResult, AIRecommendationsResponse, SkillHistoryPoint
from app.services.pdf_service import extract_text_from_pdf, validate_pdf_size
from app.services.groq_service import parse_resume_with_groq
from app.services.github_service import analyze_github_profile
from app.services.matching_service import get_or_create_matches, save_skill_history
from app.services.gemini_service import get_ai_recommendations
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/students", tags=["Students"])


# ==============================
# GET /students/vacancies
# ==============================
@router.get("/vacancies")
async def list_all_vacancies(
    user: CurrentUser = Depends(verify_token),
):
    """Возвращает все активные вакансии для просмотра студентами."""
    supabase = get_supabase()
    try:
        result = (
            supabase.table("vacancies")
            .select("*")
            .eq("is_active", True)
            .order("created_at", desc=True)
            .execute()
        )
        vacancies = result.data or []
        return [
            {
                "id": v["id"],
                "employerId": v.get("employer_id"),
                "title": v["title"],
                "company": v.get("company"),
                "description": v.get("description", ""),
                "requiredSkills": v.get("required_skills", []),
                "requiredTechnologies": v.get("required_technologies", []),
                "salary": v.get("salary_raw"),
                "salaryFrom": v.get("salary_from"),
                "salaryTo": v.get("salary_to"),
                "location": v.get("location"),
                "employmentType": v.get("employment_type"),
                "isActive": v.get("is_active", True),
                "status": "active",
                "createdAt": v.get("created_at"),
                "candidatesCount": 0,
            }
            for v in vacancies
        ]
    except Exception as e:
        logger.error(f"Ошибка получения вакансий для студента: {e}")
        raise HTTPException(status_code=500, detail="Ошибка загрузки вакансий")


def calculate_profile_completion(profile: dict) -> int:
    """Вычисляет процент заполненности профиля студента (0-100)."""
    score = 0
    
    # Имя — 15 баллов
    if profile.get("name"): score += 15
    
    # Университет — 15 баллов
    if profile.get("university"): score += 15
    
    # Специальность — 15 баллов
    if profile.get("specialization"): score += 15
    
    # Навыки — до 30 баллов
    skills_obj = profile.get("skills", [])
    if isinstance(skills_obj, dict):
        hard_skills = skills_obj.get("hard_skills", [])
        if len(hard_skills) >= 3: score += 30
        elif len(hard_skills) >= 1: score += 15
    elif isinstance(skills_obj, list):
        if len(skills_obj) >= 3: score += 30
        elif len(skills_obj) >= 1: score += 15
    
    # Резюме — 15 баллов
    if profile.get("resume_url"): score += 15
    
    # GitHub — 10 баллов
    if profile.get("github_url"): score += 10
        
    return min(score, 100)


# ==============================
# POST /students/profile
# ==============================
@router.post("/profile", response_model=StudentProfileResponse, status_code=status.HTTP_200_OK)
async def create_or_update_profile(
    data: StudentProfileCreate,
    user: CurrentUser = Depends(require_role("student")),
):
    """
    Создаёт или обновляет профиль студента в таблице students и profiles.
    """
    supabase = get_supabase()
    
    try:
        # 1. Создаём или обновляем запись в profiles (upsert — создаёт если нет)
        profile_update = {
            "id": user.user_id,
            "role": "student",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if data.name:
            profile_update["name"] = data.name
        if data.university:
            profile_update["organization"] = data.university
            
        supabase.table("profiles").upsert(profile_update, on_conflict="id").execute()

        # 2. Обновляем био и навыки в student_profiles
        student_data = {
            "user_id": user.user_id,
            "bio": data.bio,
            "skills": data.skills, # Теперь это просто список строк
            "specialty": data.specialization,
            "university": data.university,
            "github_url": data.githubUrl,
            "resume_url": data.resumeUrl,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        result = (
            supabase.table("student_profiles")
            .upsert(student_data, on_conflict="user_id")
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Ошибка сохранения профиля student_profiles")
        
        # Обновляем матчи в фоне (опционально можно добавить Celery/BackgroundTasks)
        # В данном случае просто возвращаем профиль
        return await get_profile(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка сохранения профиля студента {user.user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


# ==============================
# GET /students/profile
# ==============================
@router.get("/profile", response_model=StudentProfileResponse)
async def get_profile(user: CurrentUser = Depends(require_role("student"))):
    """Возвращает профиль текущего студента (join profiles + students)."""
    supabase = get_supabase()
    
    try:
        # Получаем данные из profiles (может не существовать для новых пользователей)
        prof_res = supabase.table("profiles").select("*").eq("id", user.user_id).execute()
        profile = prof_res.data[0] if prof_res.data else {}

        # Получаем данные из student_profiles (может не существовать для новых пользователей)
        stud_res = supabase.table("student_profiles").select("*").eq("user_id", user.user_id).execute()
        student = stud_res.data[0] if stud_res.data else {}

        # Формируем плоский список навыков для фронтенда
        skills_raw = student.get("skills", [])
        flat_skills = skills_raw if isinstance(skills_raw, list) else []
        
        # Вычисляем прогресс
        completion = calculate_profile_completion({
            "name": profile.get("name") or student.get("name"),
            "specialization": student.get("specialty"),
            "skills": skills_raw,
            "university": student.get("university") or profile.get("organization"),
            "resume_url": student.get("resume_url"),
            "github_url": student.get("github_url"),
        })

        return StudentProfileResponse(
            id=user.user_id,
            userId=user.user_id,
            name=profile.get("name", ""),
            email=user.email,
            role=profile.get("role", "student"),
            organization=profile.get("organization"),
            university=student.get("university") or profile.get("organization"),
            specialization=student.get("specialty", ""), 
            skills=flat_skills,
            bio=student.get("bio", ""),
            githubUrl=student.get("github_url"),
            resumeUrl=student.get("resume_url"),
            profileCompleteness=completion,
            createdAt=student.get("created_at"),
            updatedAt=student.get("updated_at"),
        )
    except Exception as e:
        logger.error(f"Ошибка получения профиля студента {user.user_id}: {e}")
        return StudentProfileResponse(
            id=user.user_id,
            userId=user.user_id,
            name=user.email.split("@")[0],
            email=user.email,
            role="student",
            organization=None,
            bio="",
            skills=[],
            createdAt=None,
            updatedAt=None,
        )


# ==============================
# POST /students/upload-resume
# ==============================
@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(..., description="PDF резюме"),
    user: CurrentUser = Depends(require_role("student")),
):
    """
    Загружает PDF резюме студента.
    
    1. Валидирует PDF (размер, тип)
    2. Извлекает текст через pdfplumber
    3. Парсит структуру через Groq (skills, technologies, experience)
    4. Загружает файл в Supabase Storage
    5. Обновляет профиль студента
    """
    # Проверяем тип файла
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Поддерживаются только PDF файлы")
    
    file_bytes = await file.read()
    
    try:
        validate_pdf_size(file_bytes, max_mb=10)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Извлекаем текст из PDF
    try:
        resume_text = await extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    
    # Парсим резюме через Groq
    try:
        parsed_resume = await parse_resume_with_groq(resume_text)
        logger.info(f"✅ Groq result for {user.user_id}:\n{parsed_resume}")
    except Exception as e:
        logger.error(f"Ошибка парсинга Groq: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка анализа резюме AI: {str(e)}")
    
    # Загружаем в Supabase Storage
    supabase = get_supabase()
    # RLS policy expects foldername[1] to equal auth.uid()
    storage_path = f"{user.user_id}/{file.filename}"
    resume_url = None
    
    try:
        supabase.storage.from_("resumes").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
        resume_url = f"{supabase.storage_url}/object/public/resumes/{storage_path}"
    except Exception as e:
        logger.warning(f"Ошибка загрузки резюме в Storage: {e}")
        resume_url = None
    
    # Получаем текущие навыки из student_profiles
    try:
        existing = (
            supabase.table("student_profiles")
            .select("skills")
            .eq("user_id", user.user_id)
            .execute()
        )
        current_skills = existing.data[0].get("skills", []) if existing.data else []
    except Exception:
        current_skills = []
    
    # Объединяем навыки из резюме с существующими
    all_skills = list(set(
        (current_skills or []) + 
        (parsed_resume.get("skills") or []) + 
        (parsed_resume.get("technologies") or []) + 
        (parsed_resume.get("programming_languages") or [])
    ))
    
    completion = calculate_profile_completion({
        "skills": all_skills, "resume_url": resume_url or "uploaded"
    })
    
    update_data: dict = {
        "user_id": user.user_id,
        "skills": all_skills,
        "bio": parsed_resume.get("experience_description", ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if resume_url:
        update_data["resume_url"] = resume_url
    
    try:
        supabase.table("student_profiles").upsert(update_data, on_conflict="user_id").execute()
    except Exception as e:
        logger.error(f"Ошибка сохранения профиля: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при сохранении резюме: {str(e)}")
    
    return {
        "message": "Резюме успешно загружено и проанализировано",
        "resumeUrl": resume_url,
        "extractedSkills": parsed_resume.get("skills") or [],
        "extractedTechnologies": parsed_resume.get("technologies") or [],
        "experienceYears": parsed_resume.get("experience_years") or 0,
        "profileCompleteness": completion,
    }


# ==============================
# POST /students/connect-github
# ==============================
@router.post("/connect-github", response_model=GitHubAnalysisResponse)
async def connect_github(
    data: GitHubConnectRequest,
    user: CurrentUser = Depends(require_role("student")),
):
    """
    Привязывает GitHub аккаунт и анализирует репозитории.
    
    PyGithub получает репозитории → находит языки программирования
    → добавляет технологии к профилю студента.
    """
    try:
        github_data = await analyze_github_profile(data.githubUrl)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Обновляем профиль с найденными технологиями
    supabase = get_supabase()
    
    try:
        existing = (
            supabase.table("student_profiles")
            .select("skills")
            .eq("user_id", user.user_id)
            .single()
            .execute()
        )
        current_skills = existing.data.get("skills", []) if existing.data else []
    except Exception:
        current_skills = []
    
    new_skills = list(set(
        (current_skills or []) + 
        github_data["top_technologies"]
    ))
    
    supabase.table("student_profiles").upsert({
        "user_id": user.user_id,
        "skills": new_skills,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id").execute()
    
    return GitHubAnalysisResponse(**github_data)


# ==============================
# GET /students/matches
# ==============================
@router.get("/matches", response_model=list[MatchResult])
async def get_matches(user: CurrentUser = Depends(require_role("student"))):
    """
    Возвращает топ вакансий с AI матчингом.
    Использует кеш (24 часа) в таблице matches.
    """
    supabase = get_supabase()
    
    # Получаем профиль студента
    try:
        profile_result = (
            supabase.table("student_profiles")
            .select("*")
            .eq("user_id", user.user_id)
            .single()
            .execute()
        )
        student_profile = profile_result.data
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Профиль не найден. Заполните профиль студента для получения матчинга."
        )
    
    if not student_profile:
        raise HTTPException(status_code=404, detail="Заполните профиль для получения матчинга")
    
    skills = student_profile.get("skills") or []
    if not skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Добавьте навыки в профиль для получения матчинга"
        )
    
    matches = await get_or_create_matches(user.user_id, student_profile)
    
    return [
        MatchResult(
            vacancyId=m.get("vacancy_id", ""),
            vacancyTitle=m.get("vacancy_title", ""),
            company=m.get("company"),
            matchPercent=m.get("match_percent", 0),
            matchingSkills=m.get("strong_skills", []),
            missingSkills=m.get("missing_skills", []),
            explanation=m.get("explanation", ""),
            salaryFrom=m.get("salary_from"),
            salaryTo=m.get("salary_to"),
            location=m.get("location"),
            employmentType=m.get("employment_type"),
            cachedAt=m.get("cached_at"),
        )
        for m in matches
    ]


# ==============================
# GET /students/recommendations
# ==============================
@router.get("/recommendations", response_model=AIRecommendationsResponse)
async def get_recommendations(user: CurrentUser = Depends(require_role("student"))):
    """
    Возвращает персональные AI рекомендации через Gemini:
    - Топ-3 навыка для изучения
    - Рекомендованные карьерные направления
    - История роста навыков (из skill_history)
    """
    supabase = get_supabase()
    
    # Профиль студента
    try:
        profile_result = (
            supabase.table("student_profiles")
            .select("*")
            .eq("user_id", user.user_id)
            .single()
            .execute()
        )
        student_profile = profile_result.data or {}
    except Exception:
        student_profile = {}
    
    # Матчи студента для анализа недостающих навыков
    try:
        matches_result = (
            supabase.table("matches")
            .select("missing_skills, match_percent")
            .eq("student_id", user.user_id)
            .order("match_percent", desc=True)
            .limit(10)
            .execute()
        )
        matches = matches_result.data or []
    except Exception:
        matches = []
    
    # Топ навыков рынка (агрегат из всех вакансий)
    try:
        vacancies_result = (
            supabase.table("vacancies")
            .select("requirements")
            .eq("is_active", True)
            .limit(50)
            .execute()
        )
        all_skills: dict[str, int] = {}
        for v in (vacancies_result.data or []):
            reqs = v.get("requirements") or {}
            for skill in (reqs.get("required_skills") or []) + (reqs.get("required_technologies") or []):
                all_skills[skill] = all_skills.get(skill, 0) + 1
        top_market = [s for s, _ in sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:15]]
    except Exception:
        top_market = ["Python", "TypeScript", "React", "Docker", "Git", "SQL", "FastAPI"]
    
    # Получаем рекомендации от Gemini
    try:
        ai_data = await get_ai_recommendations(student_profile, matches, top_market)
    except Exception as e:
        logger.error(f"Ошибка получения рекомендаций Gemini: {e}")
        raise HTTPException(status_code=503, detail="AI сервис временно недоступен")
    
    # История навыков из skill_history
    skill_history = []
    try:
        history_result = (
            supabase.table("skill_history")
            .select("skills, snapshot_date")
            .eq("student_id", user.user_id)
            .order("snapshot_date")
            .limit(6)
            .execute()
        )
        # Рассчитываем средний % матчинга из матчей
        avg_match = round(sum(m.get("match_percent", 0) for m in matches) / len(matches)) if matches else 0
        
        for h in (history_result.data or []):
            from datetime import date
            snap_date = h.get("snapshot_date", "")
            try:
                dt = datetime.strptime(snap_date, "%Y-%m-%d")
                month_label = dt.strftime("%b %Y")
            except Exception:
                month_label = snap_date
                
            skill_history.append(SkillHistoryPoint(
                month=month_label,
                skills_count=len(h.get("skills") or []),
                avg_match_percent=avg_match,
            ))
    except Exception as e:
        logger.warning(f"Не удалось загрузить skill_history: {e}")
    
    return AIRecommendationsResponse(
        topSkills=ai_data.get("top_skills", []),
        careerDirections=ai_data.get("career_directions", []),
        skillHistory=skill_history,
        summary=ai_data.get("summary", ""),
    )
