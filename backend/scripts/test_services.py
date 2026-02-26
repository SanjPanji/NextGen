import asyncio
import os
import sys
import json
import logging

# Добавляем корневую папку в path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pdf_service import extract_text_from_pdf
from app.services.groq_service import parse_resume_with_groq
from app.services.github_service import analyze_github_profile
from app.services.matching_service import analyze_match_with_gemini

# Настройка логирования для отладки
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

async def test_pdf_and_groq():
    print("\n--- Тестирование PDF и Groq ---")
    test_pdf_path = "test_resume.pdf"
    if not os.path.exists(test_pdf_path):
        print(f"Файл {test_pdf_path} не найден. Пропускаю.")
        return

    with open(test_pdf_path, "rb") as f:
        content = f.read()
    
    print("1. Извлечение текста (PDF)...")
    text = await extract_text_from_pdf(content)
    print(f"Извлечено {len(text)} символов.")

    print("2. Структурирование (Groq)...")
    parsed = await parse_resume_with_groq(text)
    print("Результат Groq (полный JSON):")
    print(json.dumps(parsed, indent=2, ensure_ascii=False))

async def test_github():
    print("\n--- Тестирование GitHub ---")
    url = "https://github.com/octocat"
    print(f"Анализ профиля {url}...")
    try:
        data = await analyze_github_profile(url)
        print("Результат GitHub:")
        print(f"- Username: {data['username']}")
        print(f"- Репозитории: {data['total_repos']}")
        print(f"- Языки: {data['languages']}")
        print(f"- Технологии: {data['top_technologies']}")
    except Exception as e:
        print(f"Ошибка GitHub: {e}")

async def test_matching():
    print("\n--- Тестирование Матчинга (Gemini) ---")
    student_profile = {
        "skills": {"hard_skills": ["Python", "FastAPI", "React"], "soft_skills": ["Teamwork"]}
    }
    vacancy = {
        "title": "Python Developer",
        "description": "We need a Python developer with FastAPI and React experience.",
        "required_skills": ["Python", "FastAPI"],
        "required_technologies": ["PostgreSQL", "React"]
    }
    
    try:
        match_data = await analyze_match_with_gemini(student_profile, vacancy)
        print("Результат матчинга:")
        print(f"- Процент: {match_data['match_percent']}%")
        print(f"- Сильные стороны: {match_data['strong_skills']}")
        print(f"- Обоснование: {match_data['explanation']}")
    except Exception as e:
        print(f"Ошибка матчинга: {e}")

async def main():
    print("Запуск проверки сервисов...")
    await test_pdf_and_groq()
    await test_github()
    await test_matching()
    print("\nГотово.")

if __name__ == "__main__":
    asyncio.run(main())
