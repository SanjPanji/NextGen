// Страница регистрации с выбором роли
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import {
  Brain, Eye, EyeOff, Loader2, ArrowLeft,
  GraduationCap, Building2, BarChart3, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { supabase } from '../../../lib/supabase';
import { useAppStore } from '../../../lib/store';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import type { AppUser, UserRole } from '../../../lib/types';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  organization?: string;
}

const roleOptions = [
  {
    value: 'student' as UserRole,
    label: 'Студент',
    description: 'Ищу работу или стажировку',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-600',
    borderActive: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    borderDefault: 'border-border hover:border-indigo-300 dark:hover:border-indigo-700',
    textColor: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    value: 'employer' as UserRole,
    label: 'Работодатель',
    description: 'Ищу кандидатов для найма',
    icon: Building2,
    color: 'from-violet-500 to-purple-600',
    borderActive: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
    borderDefault: 'border-border hover:border-violet-300 dark:hover:border-violet-700',
    textColor: 'text-violet-700 dark:text-violet-300',
  },
  {
    value: 'university' as UserRole,
    label: 'Университет',
    description: 'Отслеживаю трудоустройство',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    borderDefault: 'border-border hover:border-emerald-300 dark:hover:border-emerald-700',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { name: '', email: '', password: '', organization: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Регистрируем через Supabase Auth напрямую
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            role: selectedRole,
            organization: values.organization ?? null,
          },
        },
      });
      console.log('signUp response:', { data: signUpData, error: signUpError });

      if (signUpError) {
        // Обрабатываем дублирование email
        const msg = signUpError.message || 'Ошибка регистрации';
        if (msg.toLowerCase().includes('already')) {
          toast.error('Этот email уже зарегистрирован. Войдите в аккаунт.');
        } else {
          toast.error('Ошибка регистрации: ' + msg);
        }
        return;
      }

      const session = signUpData.session;
      const user = signUpData.user;

      if (!user) {
        toast.error('Ошибка при создании аккаунта. Попробуйте снова.');
        return;
      }

      // Вставлять профиль вручную НЕ НУЖНО
      // SQL Триггер handle_new_user в бэкенд схеме сделает это автоматически
      // и безопаснее (SECURITY DEFINER), обходя любые RLS.

      if (!session) {
        // Если требуется подтверждение email
        toast.success('Аккаунт создан! Пожалуйста, проверьте почту или войдите.');
        navigate('/auth/login');
        return;
      }

      // Сохраняем сессию в Zustand
      const appUser: AppUser = {
        id: user.id,
        email: user.email || '',
        role: selectedRole,
        name: values.name,
        organization: values.organization,
      };

      setUser(appUser);
      setToken(session.access_token);

      toast.success(`Добро пожаловать, ${values.name}! Аккаунт создан.`);

      // Редирект по роли
      if (selectedRole === 'employer') navigate('/employer/dashboard');
      else if (selectedRole === 'university') navigate('/university/analytics');
      else navigate('/student/dashboard');

    } catch (err) {
      console.error('Критическая ошибка при регистрации:', err);
      toast.error('Произошла ошибка. Проверьте подключение и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const needsOrganization = selectedRole === 'employer' || selectedRole === 'university';

  return (
    <div className="min-h-screen flex">
      {/* Левая декоративная панель */}
      <div className="hidden lg:flex flex-col w-[420px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">CareerAI</span>
          </div>
          <h2 className="text-3xl font-black leading-tight mb-4">
            Начни карьерный путь с AI
          </h2>
          <p className="text-indigo-200 leading-relaxed">
            Зарегистрируйся за 30 секунд и получи персональный AI-матчинг уже сегодня.
          </p>
        </div>

        <div className="space-y-4">
          {[
            'Анализ профиля за секунды',
            'Персональные AI рекомендации',
            'Связь с топ-работодателями',
            'Отслеживание прогресса навыков',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-indigo-100">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Правая часть — форма */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Назад */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">На главную</span>
          </Link>

          {/* Заголовок */}
          <div>
            <h1 className="text-2xl font-black">Создать аккаунт</h1>
            <p className="text-muted-foreground mt-1 text-sm">Всего 30 секунд — подтверждение email не нужно</p>
          </div>

          {/* Выбор роли */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Я регистрируюсь как</Label>
            <div className="grid grid-cols-1 gap-2">
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${isSelected ? role.borderActive : role.borderDefault
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${isSelected ? role.textColor : ''}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Имя */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                {selectedRole === 'student' ? 'Полное имя' : 'Ваше имя'}
              </Label>
              <Input
                id="name"
                placeholder={selectedRole === 'student' ? 'Иван Петров' : 'Алексей Иванов'}
                {...register('name', {
                  required: 'Имя обязательно',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                })}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            {/* Организация (для работодателя/университета) */}
            {needsOrganization && (
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-sm font-medium">
                  {selectedRole === 'employer' ? 'Название компании' : 'Название университета'}
                </Label>
                <Input
                  id="organization"
                  placeholder={selectedRole === 'employer' ? 'ООО «ТехКорп»' : 'МГУ им. Ломоносова'}
                  {...register('organization', {
                    required: needsOrganization ? 'Обязательное поле' : false,
                  })}
                  className={errors.organization ? 'border-destructive' : ''}
                />
                {errors.organization && (
                  <p className="text-destructive text-xs">{errors.organization.message}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Введите корректный email',
                  },
                })}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            {/* Пароль */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Пароль обязателен',
                    minLength: { value: 6, message: 'Минимум 6 символов' },
                  })}
                  className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Кнопка */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </Button>
          </form>

          {/* Ссылка на вход */}
          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link to="/auth/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
