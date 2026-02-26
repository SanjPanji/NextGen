# Сервис Google Gemini 1.5 Flash — AI матчинг и рекомендации
import json
import logging
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Инициализируем Gemini при первом вызове
_model = None


def get_gemini_model():
    """Синглтон модели Gemini Flash."""
    global _model
    if _model is None:
        api_key = settings.gemini_api_key
        if not api_key or "your-gemini-api-key" in api_key:
            logger.warning("GEMINI_API_KEY не задан или содержит плейсхолдер. AI матчинг будет работать в режиме fallback.")
            return None
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model


async def analyze_match_with_gemini(
    student_profile: dict,
    vacancy: dict,
) -> dict:
    """
    Анализирует совместимость студента с вакансией через Gemini.
    
    Args:
        student_profile: Профиль студента (навыки, технологии, опыт)
        vacancy: Вакансия (требуемые навыки, описание)
        
    Returns:
        {match_percent, strong_skills, missing_skills, explanation}
    """
    model = get_gemini_model()
    if model is None:
        return _fallback_match(student_skills, vacancy_requirements)
    
    # Собираем все навыки студента из нового JSONB или старых полей
    skills_obj = student_profile.get("skills", {})
    if isinstance(skills_obj, dict):
        # Если это новый формат JSONB
        student_skills = list(skills_obj.get("hard_skills", [])) + list(skills_obj.get("soft_skills", []))
    else:
        # Fallback на старый формат списка
        student_skills = list(student_profile.get("skills", [])) + list(student_profile.get("technologies", []))
    
    # Собираем все требования вакансии
    required_skills = vacancy.get("required_skills", [])
    required_technologies = vacancy.get("required_technologies", [])
    
    if not required_skills and not required_technologies and "requirements" in vacancy:
        # Fallback на случай если данные всё же в JSONB (для обратной совместимости)
        reqs_obj = vacancy.get("requirements", {})
        if isinstance(reqs_obj, dict):
            vacancy_requirements = list(reqs_obj.get("required_skills", [])) + list(reqs_obj.get("required_technologies", []))
            exp_years = reqs_obj.get("experience_years", 0)
        else:
            vacancy_requirements = []
            exp_years = 0
    else:
        vacancy_requirements = list(required_skills) + list(required_technologies)
        exp_years = vacancy.get("experience_years", 0)
    
    prompt = f"""Ты — эксперт по карьерному матчингу. Оцени совместимость студента с вакансией.

ПРОФИЛЬ СТУДЕНТА:
- Имя: {student_profile.get('name', 'N/A')}
- Специальность: {student_profile.get('specialty', 'N/A')}
- Навыки: {', '.join(student_skills) if student_skills else 'не указаны'}
- Опыт: {student_profile.get('bio', 'не указан')}
- Карьерные интересы: {', '.join(student_profile.get('career_interests', []))}

ВАКАНСИЯ:
- Должность: {vacancy.get('title', 'N/A')}
- Компания: {vacancy.get('company', 'N/A')}
- Требуемые навыки: {', '.join(vacancy_requirements)}
- Описание: {str(vacancy.get('description', ''))[:500]}
- Опыт: {exp_years} лет

Верни ТОЛЬКО JSON (без объяснений):
{{
    "match_percent": <число 0-100>,
    "strong_skills": ["навыки которые есть у студента и нужны вакансии"],
    "missing_skills": ["навыки из вакансии которых нет у студента"],
    "explanation": "2-3 предложения: почему такой процент, что хорошо, что развить"
}}"""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                max_output_tokens=1000,
            )
        )
        
        raw = response.text.strip()
        
        # Удаляем markdown если есть
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("{") or part.startswith("json\n{"):
                    raw = part.replace("json\n", "")
                    break
        
        result = json.loads(raw)
        
        # Нормализуем match_percent в диапазон 0-100
        result["match_percent"] = max(0, min(100, int(result.get("match_percent", 0))))
        
        logger.info(
            f"Gemini матчинг {student_profile.get('name')} × {vacancy.get('title')}: "
            f"{result['match_percent']}%"
        )
        return result
        
    except Exception as e:
        logger.error(f"Ошибка Gemini API при матчинге: {e}")
        return _fallback_match(student_skills, vacancy_requirements)


async def get_ai_recommendations(
    student_profile: dict,
    matches: list[dict],
    top_market_skills: list[str],
) -> dict:
    """
    Генерирует персональные AI рекомендации для студента.
    
    Args:
        student_profile: Профиль студента
        matches: Список матчей студента с вакансиями
        top_market_skills: Топ навыков рынка труда
        
    Returns:
        {top_skills, career_directions, summary}
    """
    model = get_gemini_model()
    if model is None:
        return _fallback_recommendations(student_skills, top_market_skills)
    
    student_skills = (
        student_profile.get("skills", []) +
        student_profile.get("technologies", [])
    )
    
    # Находим навыки которых нет у студента но есть в матчах
    all_missing = []
    for match in matches[:10]:  # Берём топ-10 матчей
        all_missing.extend(match.get("missing_skills", []))
    
    # Считаем частоту недостающих навыков
    missing_count: dict[str, int] = {}
    for skill in all_missing:
        missing_count[skill] = missing_count.get(skill, 0) + 1
    top_missing = sorted(missing_count.items(), key=lambda x: x[1], reverse=True)[:10]
    
    prompt = f"""Ты — карьерный AI-консультант. Составь персональный план развития студента.

ПРОФИЛЬ:
- Специальность: {student_profile.get('specialty', 'N/A')}
- Текущие навыки: {', '.join(student_skills[:20]) if student_skills else 'не указаны'}
- Карьерные интересы: {', '.join(student_profile.get('career_interests', []))}

АНАЛИЗ РЫНКА:
- Топ навыков рынка: {', '.join(top_market_skills[:15])}
- Недостающие для вакансий: {', '.join([s for s, _ in top_missing[:8]])}

Верни ТОЛЬКО JSON:
{{
    "top_skills": [
        {{
            "skill": "название навыка",
            "explanation": "почему этот навык важен для карьеры студента",
            "priority": "high|medium|low",
            "demand_percent": <50-95>,
            "resources": ["ресурс 1", "ресурс 2"]
        }}
    ],
    "career_directions": [
        {{
            "title": "направление карьеры",
            "description": "описание куда ведёт это направление",
            "match_percent": <40-90>,
            "avg_salary": "100,000 - 200,000 ₽",
            "key_skills_needed": ["навык 1", "навык 2"]
        }}
    ],
    "summary": "2-3 предложения с общим анализом профиля и главным советом"
}}

top_skills — ровно 3 навыка. career_directions — ровно 3 направления."""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=2000,
            )
        )
        
        raw = response.text.strip()
        
        # Вычищаем markdown
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                if "{" in part:
                    raw = part.replace("json\n", "").strip()
                    break
        
        result = json.loads(raw)
        logger.info(f"Gemini рекомендации сгенерированы для {student_profile.get('name')}")
        return result
        
    except Exception as e:
        logger.error(f"Ошибка Gemini рекомендаций: {e}")
        return _fallback_recommendations(student_skills, top_market_skills)


def _fallback_match(student_skills: list[str], vacancy_requirements: list[str]) -> dict:
    """Fallback матчинг без AI — простое пересечение навыков."""
    if not vacancy_requirements:
        return {"match_percent": 0, "strong_skills": [], "missing_skills": [], "explanation": "Навыки не указаны"}
    
    student_lower = {s.lower() for s in student_skills}
    strong = [req for req in vacancy_requirements if req.lower() in student_lower]
    missing = [req for req in vacancy_requirements if req.lower() not in student_lower]
    percent = round(len(strong) / len(vacancy_requirements) * 100)
    
    return {
        "match_percent": percent,
        "strong_skills": strong,
        "missing_skills": missing,
        "explanation": f"Совпадает {len(strong)} из {len(vacancy_requirements)} требуемых навыков."
    }


def _fallback_recommendations(student_skills: list[str], market_skills: list[str]) -> dict:
    """Fallback рекомендации без AI."""
    missing = [s for s in market_skills[:5] if s not in student_skills]
    return {
        "top_skills": [
            {"skill": s, "explanation": "Высокий спрос на рынке труда", "priority": "high",
             "demand_percent": 70, "resources": []}
            for s in missing[:3]
        ],
        "career_directions": [
            {"title": "Full-Stack разработка", "description": "Универсальный разработчик",
             "match_percent": 60, "avg_salary": "150,000 ₽", "key_skills_needed": market_skills[:3]}
        ],
        "summary": "Заполните профиль полностью для получения персональных рекомендаций."
    }
