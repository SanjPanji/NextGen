// Страница входа в систему
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Brain, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { supabase } from '../../../lib/supabase';
import { useAppStore } from '../../../lib/store';
import type { AppUser, UserRole } from '../../../lib/types';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Вход через Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        let msg = 'Неверный email или пароль';
        if (error.message === 'Email not confirmed') {
          msg = 'Email не подтвержден. Пожалуйста, проверьте почту.';
        } else if (error.message !== 'Invalid login credentials') {
          msg = error.message;
        }
        toast.error('Ошибка входа: ' + msg);
        return;
      }

      if (!data.session || !data.user) {
        toast.error('Не удалось получить сессию. Попробуйте снова.');
        return;
      }

      // Получаем профиль из public.profiles
      let role: UserRole = (data.user.user_metadata?.role as UserRole) || 'student';
      let name: string = (data.user.user_metadata?.name as string) || data.user.email || '';
      let organization: string | undefined = data.user.user_metadata?.organization as string | undefined;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role, organization')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
        role = profile.role as UserRole;
        name = profile.name;
        organization = profile.organization ?? undefined;
      }

      const appUser: AppUser = {
        id: data.user.id,
        email: data.user.email || '',
        role,
        name,
        organization,
      };

      // Сохраняем в Zustand store
      setUser(appUser);
      setToken(data.session.access_token);

      toast.success(`Добро пожаловать, ${name}!`);

      // Редирект на правильный дашборд по роли
      if (role === 'employer') navigate('/employer/dashboard');
      else if (role === 'university') navigate('/university/analytics');
      else navigate('/student/dashboard');

    } catch (err) {
      console.error('Критическая ошибка при входе:', err);
      toast.error('Произошла ошибка при входе. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая часть — форма */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="max-w-sm w-full mx-auto space-y-8">
          {/* Лого */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">На главную</span>
            </Link>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                CareerAI
              </span>
            </div>
            <h1 className="text-2xl font-black">Добро пожаловать</h1>
            <p className="text-muted-foreground mt-1">Войдите в свой аккаунт</p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Пароль */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Кнопка входа */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          {/* Ссылка на регистрацию */}
          <p className="text-center text-sm text-muted-foreground">
            Ещё нет аккаунта?{' '}
            <Link to="/auth/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Зарегистрироваться
            </Link>
          </p>

          {/* Демо-подсказка */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground text-center">
            💡 Нет аккаунта? Зарегистрируйтесь за 30 секунд — подтверждение email не требуется.
          </div>
        </div>
      </div>

      {/* Правая часть — декор (только десктоп) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black">AI находит работу мечты</h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Более 10,000 студентов уже нашли работу с помощью нашего AI-матчинга.
            Точность совпадения — 94%.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '94%', label: 'Точность AI' },
              { value: '10K+', label: 'Студентов' },
              { value: '850+', label: 'Компаний' },
              { value: '3.2×', label: 'Быстрее' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-indigo-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
