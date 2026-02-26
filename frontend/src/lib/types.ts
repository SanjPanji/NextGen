// ==============================
// ТИПЫ ДАННЫХ ПРИЛОЖЕНИЯ
// AI Career Matching Platform
// ==============================

/** Роли пользователей в системе */
export type UserRole = 'student' | 'employer' | 'university';

/** Пользователь приложения */
export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  organization?: string;
}

/** Профиль студента */
export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  university: string;
  specialization: string;
  skills: string[];
  githubUrl?: string;
  resumeUrl?: string;
  profileCompleteness: number; // 0-100%
  updatedAt?: string;
}

/** Совпадение студента с вакансией */
export interface VacancyMatch {
  id: string;
  vacancyTitle: string;
  company: string;
  matchPercent: number; // 0-100%
  matchingSkills: string[];
  missingSkills: string[];
  aiExplanation: string;
  salary?: string;
  location?: string;
  employmentType?: string;
}

/** Рекомендуемый навык для изучения */
export interface SkillRecommendation {
  skill: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
  demand: number; // % вакансий, требующих этот навык
}

/** Рекомендуемое карьерное направление */
export interface CareerDirection {
  title: string;
  description: string;
  matchPercent: number;
  avgSalary?: string;
}

/** Точка истории роста навыков */
export interface SkillHistoryPoint {
  month: string;
  skillsCount: number;
  avgMatchPercent: number;
}

/** AI рекомендации для студента */
export interface AIRecommendations {
  topSkills: SkillRecommendation[];
  careerDirections: CareerDirection[];
  skillHistory: SkillHistoryPoint[];
  summary: string;
}

/** Вакансия работодателя */
export interface Vacancy {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  salary?: string;
  location: string;
  employmentType: string;
  createdAt: string;
  candidatesCount: number;
  status: 'active' | 'closed' | 'draft';
}

/** Кандидат на вакансию */
export interface Candidate {
  id: string;
  name: string;
  university: string;
  specialization: string;
  matchPercent: number;
  missingSkills: string[];
  matchingSkills: string[];
  email: string;
  skills: string[];
  githubUrl?: string;
  avgGrade?: number;
}

/** Данные о востребованности навыка */
export interface SkillDemand {
  skill: string;
  demand: number;
}

/** Категория готовности студентов */
export interface ReadinessCategory {
  label: string;
  value: number;
  color: string;
}

/** Точка ежемесячного роста */
export interface MonthlyGrowth {
  month: string;
  avgSkills: number;
  avgMatch: number;
  studentsCount: number;
}

/** Аналитика университета */
export interface UniversityAnalytics {
  topSkills: SkillDemand[];
  readinessDistribution: ReadinessCategory[];
  skillsGrowth: MonthlyGrowth[];
  totalStudents: number;
  avgMatchRate: number;
  employedStudents: number;
}

/** Статистика дашборда работодателя */
export interface EmployerDashboardStats {
  activeVacancies: number;
  totalCandidates: number;
  avgMatchRate: number;
  contactedCandidates: number;
  recentMatches: Array<{
    name: string;
    vacancy: string;
    matchPercent: number;
    university: string;
  }>;
}
