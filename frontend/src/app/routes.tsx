// React Router конфигурация с role-based маршрутами
import { createBrowserRouter, Outlet, Navigate } from 'react-router';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Страницы
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentMatches from './pages/student/Matches';
import StudentRecommendations from './pages/student/Recommendations';
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerVacancies from './pages/employer/Vacancies';
import EmployerCandidates from './pages/employer/Candidates';
import UniversityAnalytics from './pages/university/Analytics';

/**
 * Layout для авторизованных страниц.
 * Pathless route (без path) — оборачивает дочерние роуты без конфликта с '/'.
 */
function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* lg:pl-60 — отступ для десктопного сайдбара, pt-14 — для мобильного топбара */}
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** 404 Not Found */
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-8xl font-black text-muted-foreground/10">404</p>
        <h1 className="text-2xl font-bold">Страница не найдена</h1>
        <p className="text-muted-foreground">Запрошенная страница не существует</p>
        <a href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // ==============================
  // ПУБЛИЧНЫЕ СТРАНИЦЫ
  // ==============================
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth/login',
    element: <Login />,
  },
  {
    path: '/auth/register',
    element: <Register />,
  },

  // ==============================
  // АВТОРИЗОВАННЫЕ СТРАНИЦЫ
  // Pathless layout route — не конфликтует с '/'
  // ==============================
  {
    // Без path: этот route рендерит AppLayout для всех дочерних маршрутов
    element: <AppLayout />,
    children: [
      // ==================
      // СТУДЕНТ
      // ==================
      {
        path: '/student',
        element: <ProtectedRoute requiredRole="student" />,
        children: [
          { index: true, element: <Navigate to="/student/dashboard" replace /> },
          { path: 'dashboard', element: <StudentDashboard /> },
          { path: 'profile', element: <StudentProfile /> },
          { path: 'matches', element: <StudentMatches /> },
          { path: 'recommendations', element: <StudentRecommendations /> },
        ],
      },

      // ==================
      // РАБОТОДАТЕЛЬ
      // ==================
      {
        path: '/employer',
        element: <ProtectedRoute requiredRole="employer" />,
        children: [
          { index: true, element: <Navigate to="/employer/dashboard" replace /> },
          { path: 'dashboard', element: <EmployerDashboard /> },
          { path: 'vacancies', element: <EmployerVacancies /> },
          { path: 'vacancies/:id/candidates', element: <EmployerCandidates /> },
        ],
      },

      // ==================
      // УНИВЕРСИТЕТ
      // ==================
      {
        path: '/university',
        element: <ProtectedRoute requiredRole="university" />,
        children: [
          { index: true, element: <Navigate to="/university/analytics" replace /> },
          { path: 'analytics', element: <UniversityAnalytics /> },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFound />,
  },
]);
