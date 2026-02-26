// Дашборд студента
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useMemo } from 'react';
import {
  User, Briefcase, Star, TrendingUp, ArrowRight,
  Zap, Target, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { SkillBadge } from '../../components/student/SkillBadge';
import { useAppStore } from '../../../lib/store';
import { getStudentProfile, getAllVacancies } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import { vacanciesToMatches } from '../../../lib/matchUtils';

export default function StudentDashboard() {
  const { user } = useAppStore();

  // Запрос профиля студента
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: QueryKeys.studentProfile,
    queryFn: getStudentProfile,
  });

  // Запрос всех вакансий
  const { data: vacancies, isLoading: vacanciesLoading } = useQuery({
    queryKey: ['vacancies'],
    queryFn: getAllVacancies,
    staleTime: 30 * 60 * 1000,
  });

  // Рассчитываем матчи на клиенте
  const matches = useMemo(() => {
    if (!vacancies || !profile) return [];
    return vacanciesToMatches(vacancies, profile).sort((a, b) => b.matchPercent - a.matchPercent);
  }, [vacancies, profile]);

  const matchesLoading = profileLoading || vacanciesLoading;
  const topMatches = matches?.slice(0, 3) || [];
  const completeness = profile?.profileCompleteness || 0;

  // Статистика дашборда
  const stats = [
    {
      label: 'Заполненность профиля',
      value: `${completeness}%`,
      icon: User,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      link: '/student/profile',
    },
    {
      label: 'Навыков в профиле',
      value: profile?.skills?.length || 0,
      icon: Zap,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      link: '/student/profile',
    },
    {
      label: 'Найдено совпадений',
      value: matches?.length || 0,
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      link: '/student/matches',
    },
    {
      label: 'Лучшее совпадение',
      value: topMatches[0] ? `${topMatches[0].matchPercent}%` : '—',
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      link: '/student/matches',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Привет, {user?.name?.split(' ')[0] || 'Студент'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Вот что происходит с вашим карьерным профилем
          </p>
        </div>
        <Link to="/student/matches">
          <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white gap-2 hidden sm:flex">
            <Zap className="w-4 h-4" />
            AI матчинг
          </Button>
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-black">
                        {profileLoading || matchesLoading ? (
                          <Skeleton className="h-7 w-14" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Заполненность профиля */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Профиль</h3>
              <Link to="/student/profile">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Редактировать <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Заполненность</span>
                    <span className="text-sm font-bold">{completeness}%</span>
                  </div>
                  <ProgressBar value={completeness} size="md" />
                </div>

                {completeness < 100 && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                    💡 <strong>Совет:</strong> Добавьте GitHub и загрузите резюме, чтобы повысить качество AI матчинга.
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Ваши навыки ({profile?.skills?.length || 0})
                  </p>
                  {profile?.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 8).map((skill) => (
                        <SkillBadge key={skill} skill={skill} variant="default" />
                      ))}
                      {profile.skills.length > 8 && (
                        <span className="text-xs text-muted-foreground">+{profile.skills.length - 8}</span>
                      )}
                    </div>
                  ) : (
                    <Link to="/student/profile">
                      <Button variant="outline" size="sm" className="w-full text-xs h-8">
                        + Добавить навыки
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Лучшие совпадения */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Топ совпадений AI</h3>
              <Link to="/student/matches">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Все совпадения <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchesLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-14 rounded-full flex-shrink-0" />
                  </div>
                ))}
              </>
            ) : topMatches.length > 0 ? (
              topMatches.map((match, index) => {
                const getMatchColor = (p: number) => p >= 75 ? 'from-emerald-500 to-green-600' : p >= 50 ? 'from-amber-400 to-yellow-500' : 'from-red-500 to-rose-500';
                return (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow bg-card"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getMatchColor(match.matchPercent)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-white text-xs font-black">{match.matchPercent}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{match.vacancyTitle}</p>
                      <p className="text-xs text-muted-foreground">{match.company}</p>
                    </div>
                    <ProgressBar value={match.matchPercent} size="sm" className="w-20 flex-shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Заполните профиль для получения AI матчинга</p>
                <Link to="/student/profile">
                  <Button size="sm" className="mt-3">Заполнить профиль</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <div>
        <h3 className="font-semibold mb-3">Быстрые действия</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'Обновить профиль', desc: 'Добавить навыки и GitHub', icon: User, link: '/student/profile', color: 'from-indigo-500 to-violet-600' },
            { title: 'Посмотреть матчинг', desc: 'AI нашёл подходящие вакансии', icon: Briefcase, link: '/student/matches', color: 'from-violet-500 to-purple-600' },
            { title: 'AI рекомендации', desc: 'Что изучить для роста', icon: Star, link: '/student/recommendations', color: 'from-amber-500 to-orange-600' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.link}>
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}