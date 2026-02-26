# Pydantic модели для вакансий
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VacancyCreate(BaseModel):
    """Модель для создания вакансии работодателем."""
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    requiredSkills: Optional[list[str]] = Field(default=[], alias="requiredSkills")
    requiredTechnologies: Optional[list[str]] = Field(default=[], alias="requiredTechnologies")
    salary: Optional[str] = Field(None, description="Зарплата строкой")
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    location: Optional[str] = None
    employment_type: Optional[str] = Field(None, alias="employmentType")

    class Config:
        populate_by_name = True


class VacancyUpdate(BaseModel):
    """Модель для обновления вакансии."""
    title: Optional[str] = None
    description: Optional[str] = None
    requiredSkills: Optional[list[str]] = Field(None, alias="requiredSkills")
    requiredTechnologies: Optional[list[str]] = Field(None, alias="requiredTechnologies")
    salary: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    location: Optional[str] = None
    employment_type: Optional[str] = Field(None, alias="employmentType")
    is_active: Optional[bool] = None

    class Config:
        populate_by_name = True


class VacancyResponse(BaseModel):
    """Полная модель вакансии для ответа API."""
    id: str
    employerId: str = Field(..., alias="employer_id")
    title: str
    company: Optional[str] = None
    description: str
    requiredSkills: list[str] = Field(default=[], alias="required_skills")
    requiredTechnologies: list[str] = Field(default=[], alias="required_technologies")
    salary: Optional[str] = Field(None, alias="salary_raw")
    salaryFrom: Optional[int] = Field(None, alias="salary_from")
    salaryTo: Optional[int] = Field(None, alias="salary_to")
    location: Optional[str] = None
    employmentType: Optional[str] = Field(None, alias="employment_type")
    isActive: bool = Field(True, alias="is_active")
    status: str = "active"
    createdAt: Optional[datetime] = Field(None, alias="created_at")
    candidatesCount: Optional[int] = Field(0, alias="candidates_count")

    class Config:
        from_attributes = True
        populate_by_name = True
