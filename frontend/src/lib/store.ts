// Zustand глобальный стейт — пользователь, токен, роль
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUser } from './types';

interface AppState {
  /** Текущий пользователь (null если не авторизован) */
  user: AppUser | null;
  /** JWT токен Supabase для API запросов */
  token: string | null;
  /** Флаг загрузки при инициализации */
  isLoading: boolean;
}

interface AppActions {
  setUser: (user: AppUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  /** Полный выход — очищает все данные */
  logout: () => void;
}

type AppStore = AppState & AppActions;

/**
 * Глобальный стейт приложения с персистентностью в localStorage.
 * Ключ: 'career-match-store'
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Начальное состояние
      user: null,
      token: null,
      isLoading: true,

      // Actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null, isLoading: false }),
    }),
    {
      name: 'career-match-store',
      // Персистируем только user и token (не isLoading)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
