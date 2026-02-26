// Защищённый маршрут с проверкой роли пользователя
import { Navigate, Outlet } from 'react-router';
import { useAppStore } from '../../../lib/store';
import type { UserRole } from '../../../lib/types';

interface ProtectedRouteProps {
  /** Одна или несколько разрешённых ролей */
  requiredRole: UserRole | UserRole[];
}

/**
 * Обёртка для защищённых маршрутов.
 * - Нет пользователя → редирект на /auth/login
 * - Неверная роль → редирект на правильный дашборд
 */
export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user } = useAppStore();

  // Не авторизован — на логин
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // Роль не совпадает — редиректим на правильный дашборд
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'employer') return <Navigate to="/employer/dashboard" replace />;
    if (user.role === 'university') return <Navigate to="/university/analytics" replace />;
  }

  return <Outlet />;
}
