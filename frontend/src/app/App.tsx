// Корневой компонент приложения CareerAI
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Brain } from 'lucide-react';
import { router } from './routes';
import { queryClient } from '../lib/queryClient';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import type { AppUser, UserRole } from '../lib/types';

/**
 * Полноэкранный спиннер при восстановлении сессии
 */
function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Провайдер для восстановления сессии Supabase при перезагрузке.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, logout, setLoading, isLoading } = useAppStore();

  useEffect(() => {
    /**
     * Получаем AppUser из сессии + public.profiles.
     * Сначала пробуем БД, фоллбэк на user_metadata.
     */
    async function buildAppUser(session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> }; access_token: string }) {
      const u = session.user;
      let role = (u.user_metadata?.role as UserRole) || 'student';
      let name = (u.user_metadata?.name as string) || u.email || '';
      let organization: string | undefined = u.user_metadata?.organization as string | undefined;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role, organization')
          .eq('id', u.id)
          .maybeSingle();

        if (profile) {
          role = profile.role as UserRole;
          name = profile.name;
          organization = profile.organization ?? undefined;
        }
      } catch {
        // Фоллбэк на user_metadata — уже установлено выше
      }

      const appUser: AppUser = {
        id: u.id,
        email: u.email || '',
        role,
        name,
        organization,
      };

      setUser(appUser);
      setToken(session.access_token);
    }

    // Восстановление сессии при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        buildAppUser(session).finally(() => setLoading(false));
      } else {
        logout();
        setLoading(false);
      }
    });

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        buildAppUser(session);
      } else {
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setToken, logout, setLoading]);

  if (isLoading) return <AppLoadingScreen />;
  return <>{children}</>;
}

/**
 * Главный компонент приложения.
 * Порядок провайдеров:
 * ThemeProvider → QueryClientProvider → AuthProvider → RouterProvider
 */
export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        {/* Toaster всегда доступен, независимо от состояния авторизации */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: { borderRadius: '12px' },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}