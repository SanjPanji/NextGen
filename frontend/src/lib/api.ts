// Axios клиент для запросов к FastAPI / встроенному серверу
import axios from 'axios';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAppStore } from './store';
import type {
  StudentProfile,
  VacancyMatch,
  AIRecommendations,
  Vacancy,
  Candidate,
  UniversityAnalytics,
  EmployerDashboardStats,
} from './types';

// ==============================
// НАСТРОЙКА AXIOS
// ==============================

/**
 * Базовый URL API. В первую очередь используется встроенный сервер.
 * При наличии переменной VITE_API_URL — используется FastAPI.
 */
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  `https://${projectId}.supabase.co/functions/v1/make-server-5770370e`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 секунд — AI запросы могут быть медленными
  headers: {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey, // Supabase function-level auth
  },
});

/**
 * Request interceptor: добавляет Authorization с JWT токеном пользователя.
 * Читает токен напрямую из Zustand store (в памяти, без race condition).
 */
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor: при 401 логируем ошибку, но НЕ делаем жёсткий редирект.
 * AuthProvider через onAuthStateChange сам отслеживает состояние сессии.
 */
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn('API вернул 401 — возможно, токен истёк.');
      // Не удаляем store и не редиректим — пусть AuthProvider решает
    }
    return Promise.reject(error);
  },
);

// ==============================
// API ФУНКЦИИ — STUDENT
// ==============================

/** Получить профиль студента */
export const getStudentProfile = async (): Promise<StudentProfile> => {
  const { data } = await api.get<StudentProfile>('/api/v1/students/profile');
  return data;
};

/** Сохранить/обновить профиль студента */
export const saveStudentProfile = async (
  profile: Partial<StudentProfile>,
): Promise<StudentProfile> => {
  const { data } = await api.post<StudentProfile>('/api/v1/students/profile', profile);
  return data;
};

/** Получить AI матчинг вакансий для студента */
export const getStudentMatches = async (): Promise<VacancyMatch[]> => {
  const { data } = await api.get<VacancyMatch[]>('/api/v1/students/matches');
  return data;
};

/** Получить все доступные вакансии (для студентов) */
export const getAllVacancies = async (): Promise<Vacancy[]> => {
  const { data } = await api.get<Vacancy[]>('/api/v1/students/vacancies');
  return Array.isArray(data) ? data : [];
};

/** Получить AI рекомендации для студента */
export const getStudentRecommendations = async (): Promise<AIRecommendations> => {
  const { data } = await api.get<AIRecommendations>('/api/v1/students/recommendations');
  return data;
};

/** Загрузить PDF резюме и спарсить его */
export const uploadResume = async (file: File): Promise<{
  resumeUrl: string;
  extractedSkills: string[];
  extractedTechnologies: string[];
  experienceYears: number;
  profileCompleteness: number;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/v1/students/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/** Отправить GitHub URL на анализ */
export const analyzeGitHub = async (githubUrl: string): Promise<{ skills: string[]; repos: number }> => {
  // Mock анализ GitHub — в продакшене это FastAPI endpoint с ML
  await new Promise((resolve) => setTimeout(resolve, 2500)); // Имитация задержки AI
  const skills = ['React', 'TypeScript', 'Node.js', 'JavaScript', 'CSS', 'Git'];
  return { skills, repos: 23 };
};

// ==============================
// API ФУНКЦИИ — EMPLOYER
// ==============================

/** Получить список вакансий работодателя */
export const getEmployerVacancies = async (): Promise<Vacancy[]> => {
  const { data } = await api.get<Vacancy[]>('/api/v1/employers/vacancies');
  return data;
};

/** Создать новую вакансию */
export const createVacancy = async (
  vacancy: Omit<Vacancy, 'id' | 'company' | 'createdAt' | 'candidatesCount' | 'status'>,
): Promise<Vacancy> => {
  const { data } = await api.post<Vacancy>('/api/v1/employers/vacancies', vacancy);
  return data;
};

/** Получить кандидатов для вакансии */
export const getVacancyCandidates = async (vacancyId: string): Promise<Candidate[]> => {
  const { data } = await api.get<Candidate[]>(`/api/v1/employers/vacancies/${vacancyId}/candidates`);
  return data;
};

/** Получить статистику дашборда работодателя */
export const getEmployerDashboardStats = async (): Promise<EmployerDashboardStats> => {
  const { data } = await api.get<EmployerDashboardStats>('/api/v1/analytics/employer-stats');
  return data;
};

// ==============================
// API ФУНКЦИИ — UNIVERSITY
// ==============================

/** Получить аналитику университета */
export const getUniversityAnalytics = async (): Promise<UniversityAnalytics> => {
  const { data } = await api.get<UniversityAnalytics>('/api/v1/analytics/summary');
  return data;
};