# Pydantic модели для студентов
from pydantic import BaseModel, Field
from typing import Optional


class StudentProfileCreate(BaseModel):
    """Модель для создания/обновления профиля студента."""
    name: Optional[str] = Field(None, description="Имя (из таблицы profiles)")
    bio: Optional[str] = Field(None, max_length=5000, description="Биография/опыт")
    skills: list[str] = Field(default=[], description="Список навыков")
    university: Optional[str] = None
    specialization: Optional[str] = None
    githubUrl: Optional[str] = Field(None, alias="github_url")
    resumeUrl: Optional[str] = Field(None, alias="resume_url")

    class Config:
        populate_by_name = True


class StudentProfileResponse(BaseModel):
    """Модель ответа с полным профилем студента."""
    id: str
    userId: str
    name: str
    email: str
    role: str
    organization: Optional[str] = None
    university: Optional[str] = ""
    specialization: Optional[str] = ""
    skills: list[str] = []
    bio: Optional[str] = None
    githubUrl: Optional[str] = None
    resumeUrl: Optional[str] = None
    profileCompleteness: int = 0
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    model_config = {"populate_by_name": True}


class GitHubConnectRequest(BaseModel):
    """Запрос на подключение GitHub аккаунта."""
    githubUrl: str = Field(..., alias="github_url")

    class Config:
        populate_by_name = True


class GitHubAnalysisResponse(BaseModel):
    """Результат анализа GitHub профиля."""
    username: str
    totalRepos: int = Field(..., alias="total_repos")
    languages: list[str]
    topTechnologies: list[str] = Field(..., alias="top_technologies")
    totalCommitsApprox: int = Field(..., alias="total_commits_approx")
    mostActiveRepos: list[str] = Field(..., alias="most_active_repos")
    profileUpdated: bool = Field(..., alias="profile_updated")

    class Config:
        populate_by_name = True
