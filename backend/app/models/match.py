# Pydantic модели для матчинга
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MatchResult(BaseModel):
    """Результат матчинга студента с вакансией."""
    vacancyId: str = Field(..., alias="vacancy_id")
    vacancyTitle: str = Field(..., alias="vacancy_title")
    company: Optional[str] = None
    matchPercent: int = Field(..., ge=0, le=100, alias="match_percent")
    matchingSkills: list[str] = Field(default=[], alias="strong_skills")
    missingSkills: list[str] = Field(default=[], alias="missing_skills")
    explanation: str = Field(default="", alias="explanation")
    salaryFrom: Optional[int] = Field(None, alias="salary_from")
    salaryTo: Optional[int] = Field(None, alias="salary_to")
    location: Optional[str] = None
    employmentType: Optional[str] = Field(None, alias="employment_type")
    cachedAt: Optional[datetime] = Field(None, alias="cached_at")

    class Config:
        populate_by_name = True


class SkillRecommendation(BaseModel):
    """Рекомендация по навыку для изучения."""
    skill: str
    explanation: str
    priority: str = Field(default="medium")
    demand: int = Field(default=50, ge=0, le=100, alias="demand_percent")
    resources: list[str] = Field(default=[])

    class Config:
        populate_by_name = True


class CareerDirection(BaseModel):
    """Рекомендуемое карьерное направление."""
    title: str
    description: str
    matchPercent: int = Field(..., ge=0, le=100, alias="match_percent")
    avgSalary: Optional[str] = Field(None, alias="avg_salary")
    keySkillsNeeded: list[str] = Field(default=[], alias="key_skills_needed")

    class Config:
        populate_by_name = True


class SkillHistoryPoint(BaseModel):
    """Точка истории роста навыков."""
    month: str
    skillsCount: int = Field(..., alias="skills_count")
    avgMatchPercent: int = Field(..., alias="avg_match_percent")

    class Config:
        populate_by_name = True


class AIRecommendationsResponse(BaseModel):
    """Полный ответ AI рекомендаций для студента."""
    topSkills: list[SkillRecommendation] = Field(..., alias="top_skills")
    careerDirections: list[CareerDirection] = Field(..., alias="career_directions")
    skillHistory: list[SkillHistoryPoint] = Field(..., alias="skill_history")
    summary: str

    class Config:
        populate_by_name = True


class CandidateMatch(BaseModel):
    """Кандидат (студент) в списке работодателя."""
    student_id: str
    name: str
    university: str
    specialty: str
    matchPercent: int = Field(..., alias="match_percent")
    matchingSkills: list[str] = Field(..., alias="strong_skills")
    missingSkills: list[str] = Field(..., alias="missing_skills")
    githubUrl: Optional[str] = Field(None, alias="github_url")
    resumeUrl: Optional[str] = Field(None, alias="resume_url")
    email: Optional[str] = None

    class Config:
        populate_by_name = True
