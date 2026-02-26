# Сервис структурирования резюме через Groq (быстрый LLM)
import json
import logging
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)


def get_groq_client() -> Groq:
    """Создаёт Groq клиент."""
    return Groq(api_key=settings.groq_api_key)


async def parse_resume_with_groq(resume_text: str) -> dict:
    """
    Структурирует текст резюме в JSON через Groq (llama-3.3-70b-versatile).
    
    Groq выбран для этой задачи т.к.:
    - Очень быстрый (< 1 секунды для структурирования)
    - Хорошо понимает русский текст
    - Llama-3.3-70b отлично справляется с extraction задачами
    
    Args:
        resume_text: Сырой текст из PDF
        
    Returns:
        Структурированные данные: {skills, technologies, experience, education}
    """
    client = get_groq_client()
    
    prompt = f"""Ты — HR-аналитик и эксперт по подбору технического персонала. 
Проанализируй текст резюме и выдели ТОЛЬКО реальные профессиональные навыки и технологии.

КРИТЕРИИ ИЗВЛЕЧЕНИЯ:
1. "skills" — только конкретные хард-скиллы (например: Git, CI/CD, Unit Testing, SQL). НЕ добавляй общие слова вроде "Разработка" или "Программирование".
2. "technologies" — конкретные библиотеки и фреймворки (например: FastAPI, React, PostgreSQL, Docker).
3. "programming_languages" — только языки (например: Python, JavaScript, Go).
4. Опыт работы (experience_years) — укажи числом.
5. Если информации нет — верни пустой список или пустую строку.

ТЕКСТ РЕЗЮМЕ:
{resume_text[:8000]}  

Верни JSON в точно таком формате (без лишнего текста, только валидный JSON):
{{
    "skills": ["навык1", "навык2"],
    "technologies": ["фреймворк1", "библиотека2"],
    "programming_languages": ["язык1"],
    "experience_years": 0,
    "experience_description": "краткое описание",
    "education": "вуз и специальность",
    "previous_positions": ["должность1"],
    "soft_skills": ["софт-скилл1"],
    "career_goals": "цели"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Ты извлекаешь структурированные данные из резюме. Отвечай ТОЛЬКО валидным JSON без markdown, объяснений и дополнительного текста."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,  # Низкая температура для точного extraction
            max_tokens=2000,
        )
        
        raw_response = response.choices[0].message.content.strip()
        logger.debug(f"Raw Groq response: {raw_response}")
        
        # Очищаем markdown если модель его добавила
        if raw_response.startswith("```"):
            raw_response = raw_response.split("```")[1]
            if raw_response.startswith("json"):
                raw_response = raw_response[4:]
        
        parsed = json.loads(raw_response)
        logger.info(f"Groq успешно обработал резюме: {len(parsed.get('skills', []))} навыков, {len(parsed.get('technologies', []))} технологий")
        return parsed
        
    except json.JSONDecodeError as e:
        logger.error(f"Groq вернул невалидный JSON: {e}")
        # Фоллбэк — возвращаем базовую структуру
        return {
            "skills": [],
            "technologies": [],
            "programming_languages": [],
            "experience_years": 0,
            "experience_description": resume_text[:500],
            "education": "",
            "previous_positions": [],
            "soft_skills": [],
            "career_goals": "",
        }
    except Exception as e:
        logger.error(f"Ошибка Groq API: {e}")
        raise ValueError(f"Ошибка обработки резюме через AI: {str(e)}")
