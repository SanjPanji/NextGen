// Навбар / боковая панель навигации
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, User, Briefcase, Star, BarChart3,
  LogOut, Sun, Moon, Menu, X, Brain, Building2, GraduationCap,
  Users, ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useAppStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';
import type { UserRole } from '../../../lib/types';

// Навигационные пункты по ролям
const navItems: Record<UserRole, Array<{ path: string; label: string; icon: React.ElementType }>> = {
  student: [
    { path: '/student/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/student/profile', label: 'Мой профиль', icon: User },
    { path: '/student/matches', label: 'Вакансии (AI)', icon: Briefcase },
    { path: '/student/recommendations', label: 'Рекомендации', icon: Star },
  ],
  employer: [
    { path: '/employer/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/employer/vacancies', label: 'Мои вакансии', icon: Briefcase },
  ],
  university: [
    { path: '/university/analytics', label: 'Аналитика', icon: BarChart3 },
  ],
};

// Иконка и цвет роли
const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  student: { label: 'Студент', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  employer: { label: 'Работодатель', icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  university: { label: 'Университет', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
};

export function Navbar() {
  const { user, logout } = useAppStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.role];
  const role = roleConfig[user.role];
  const RoleIcon = role.icon;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/auth/login');
  };

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Логотип */}
      <div className="p-5 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CareerAI
            </span>
            <p className="text-[10px] text-muted-foreground leading-none">AI Career Matching</p>
          </div>
        </Link>
      </div>

      <Separator />

      {/* Роль пользователя */}
      <div className={`mx-3 mt-3 p-2.5 rounded-lg ${role.bg}`}>
        <div className="flex items-center gap-2">
          <RoleIcon className={`w-4 h-4 ${role.color}`} />
          <span className={`text-xs font-medium ${role.color}`}>{role.label}</span>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Нижняя панель: пользователь + выход */}
      <div className="p-3 space-y-2">
        {/* Переключатель темы */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm">{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </Button>

        {/* Профиль пользователя */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Выход */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Выйти</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Десктопная боковая панель */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-card h-screen fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Мобильный топбар */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b h-14 flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-8 w-8"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            CareerAI
          </span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Avatar className="w-7 h-7">
          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[10px] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Мобильное меню (оверлей) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-card h-full shadow-2xl flex flex-col">
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
