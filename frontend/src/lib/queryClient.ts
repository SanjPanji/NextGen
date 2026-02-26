// React Query клиент с настройкой кеширования
import { QueryClient } from '@tanstack/react-query';

/**
 * Синглтон QueryClient для всего приложения.
 * staleTime: 30 минут — кеш матчинга и рекомендаций
 * При обновлении профиля вызываем queryClient.invalidateQueries(['matches'])
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 минут — AI результаты кешируются на долгое время
      staleTime: 30 * 60 * 1000,
      // Повторные попытки при ошибке
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Не обновлять при фокусе окна (AI запросы дорогие)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ==============================
// КЛЮЧИ ЗАПРОСОВ (Query Keys)
// ==============================

export const QueryKeys = {
  studentProfile: ['student', 'profile'] as const,
  studentMatches: ['student', 'matches'] as const,
  studentRecommendations: ['student', 'recommendations'] as const,
  employerVacancies: ['employer', 'vacancies'] as const,
  employerDashboardStats: ['employer', 'dashboard', 'stats'] as const,
  vacancyCandidates: (vacancyId: string) => ['employer', 'vacancies', vacancyId, 'candidates'] as const,
  universityAnalytics: ['university', 'analytics'] as const,
} as const;
