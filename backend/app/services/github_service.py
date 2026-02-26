# Сервис парсинга GitHub профилей через PyGithub
import logging
from typing import Optional
from github import Github, GithubException
from app.config import settings

logger = logging.getLogger(__name__)

# Топ-языки которые считаем технологиями
LANGUAGE_TO_TECHNOLOGY = {
    "Python": ["Python"],
    "TypeScript": ["TypeScript", "JavaScript"],
    "JavaScript": ["JavaScript"],
    "Go": ["Go"],
    "Rust": ["Rust"],
    "Java": ["Java"],
    "Kotlin": ["Kotlin"],
    "Swift": ["Swift"],
    "C#": ["C#", ".NET"],
    "C++": ["C++"],
    "PHP": ["PHP"],
    "Ruby": ["Ruby"],
    "HTML": ["HTML", "CSS"],
    "CSS": ["CSS"],
    "Shell": ["Linux", "Bash"],
    "Dockerfile": ["Docker"],
}


def extract_username_from_url(github_url: str) -> str:
    
    url = github_url.strip().rstrip("/")
    
    parts = url.split("github.com/")
    if len(parts) < 2:
        raise ValueError(f"Некорректный GitHub URL: {github_url}")
    username = parts[-1].split("/")[0].strip()
    if not username:
        raise ValueError(f"Не удалось извлечь username из URL: {github_url}")
    return username


async def analyze_github_profile(github_url: str) -> dict:
    """
    Анализирует GitHub профиль пользователя.
    
    Получает:
    - Список языков программирования
    - Топ репозитории по звёздам
    - Примерное количество коммитов
    - Используемые технологии
    
    Args:
        github_url: URL GitHub профиля
        
    Returns:
        Словарь с данными профиля
    """
    username = extract_username_from_url(github_url)
    logger.info(f"Анализируем GitHub профиль: {username}")
    
    try:
        # Используем токен если есть (higher rate limit: 5000/час вместо 60/час)
        token = settings.github_token
        if not token or "your_token" in token:
            token = None
            logger.info("Используем GitHub API без токена (анонимный доступ)")
            
        g = Github(token)
        
        user = g.get_user(username)
        
        # Получаем публичные репозитории (до 50)
        repos = list(user.get_repos()[:50])
        
        # Собираем статистику по языкам
        language_bytes: dict[str, int] = {}
        total_commits = 0
        repo_names = []
        
        for repo in repos:
            if repo.fork:
                continue  # Пропускаем форки
            
            repo_names.append(repo.name)
            
            # Языки репозитория
            try:
                langs = repo.get_languages()
                for lang, bytes_count in langs.items():
                    language_bytes[lang] = language_bytes.get(lang, 0) + bytes_count
            except Exception:
                pass
        
        # Топ языков по количеству байт кода
        sorted_languages = sorted(language_bytes.items(), key=lambda x: x[1], reverse=True)
        top_languages = [lang for lang, _ in sorted_languages[:10]]
        
        # Конвертируем языки в технологии
        technologies: list[str] = []
        for lang in top_languages:
            techs = LANGUAGE_TO_TECHNOLOGY.get(lang, [lang])
            for tech in techs:
                if tech not in technologies:
                    technologies.append(tech)
        
        # Топ репозитории по звёздам
        top_repos = sorted(
            [r for r in repos if not r.fork],
            key=lambda r: r.stargazers_count,
            reverse=True
        )[:5]
        top_repo_names = [r.name for r in top_repos]
        
        logger.info(f"GitHub {username}: {len(repos)} репо, языки: {top_languages[:5]}")
        
        return {
            "username": username,
            "total_repos": len(repos),
            "languages": top_languages,
            "top_technologies": technologies,
            "total_commits_approx": user.public_repos * 10,  # Примерная оценка
            "most_active_repos": top_repo_names,
            "profile_updated": True,
        }
        
    except GithubException as e:
        if e.status == 404:
            raise ValueError(f"GitHub пользователь '{username}' не найден")
        elif e.status == 403:
            raise ValueError("Превышен лимит запросов к GitHub API. Попробуйте позже.")
        raise ValueError(f"Ошибка GitHub API: {str(e)}")
    except Exception as e:
        logger.error(f"Ошибка парсинга GitHub {github_url}: {e}")
        raise ValueError(f"Не удалось проанализировать GitHub профиль: {str(e)}")
