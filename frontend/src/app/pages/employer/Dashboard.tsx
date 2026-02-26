// Дашборд работодателя
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  Briefcase, Users, TrendingUp, MessageSquare,
  ArrowRight, Star, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { MatchPercent } from '../../components/employer/MatchPercent';
import { useAppStore } from '../../../lib/store';
import { getEmployerDashboardStats, getEmployerVacancies } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';

export default function EmployerDashboard() {
  const { user } = useAppStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: QueryKeys.employerDashboardStats,
    queryFn: getEmployerDashboardStats,
  });

  const { data: vacancies, isLoading: vacanciesLoading } = useQuery({
    queryKey: QueryKeys.employerVacancies,
    queryFn: getEmployerVacancies,
  });

  const statCards = [
    { label: 'Активных вакансий', value: stats?.activeVacancies ?? '—', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Всего кандидатов', value: stats?.totalCandidates ?? '—', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Средний матчинг', value: stats?.avgMatchRate ? `${stats.avgMatchRate}%` : '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Связались', value: stats?.contactedCandidates ?? '—', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Дашборд работодателя {user?.organization ? `— ${user.organization}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Управляйте вакансиями и находите лучших кандидатов
          </p>
        </div>
        <Link to="/employer/vacancies">
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white gap-2 hidden sm:flex">
            <Briefcase className="w-4 h-4" />
            Мои вакансии
          </Button>
        </Link>
      </div>

      {/* Статы */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-md transition-all">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-black">
                      {statsLoading ? <Skeleton className="h-7 w-12" /> : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ матчи */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Лучшие кандидаты (AI)</h3>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-7 w-12 rounded-full" />
                </div>
              ))
            ) : stats?.recentMatches?.length ? (
              stats.recentMatches.map((match, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow bg-card">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {match.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{match.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.university} · {match.vacancy}</p>
                  </div>
                  <MatchPercent value={match.matchPercent} size="sm" showBar />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">Нет данных</p>
            )}
            <Link to="/employer/vacancies">
              <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                Смотреть все вакансии <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Активные вакансии */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Активные вакансии</h3>
              <Link to="/employer/vacancies">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Все вакансии <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {vacanciesLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg border space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : vacancies?.filter(v => v.status === 'active').slice(0, 4).map((vacancy) => (
              <Link key={vacancy.id} to={`/employer/vacancies/${vacancy.id}/candidates`}>
                <div className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all hover:border-violet-200 dark:hover:border-violet-800 cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {vacancy.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{vacancy.candidatesCount} кандидатов</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{vacancy.candidatesCount}</div>
                    <div className="text-[10px] text-muted-foreground">кандид.</div>
                  </div>
                </div>
              </Link>
            ))}

            {!vacanciesLoading && (!vacancies || vacancies.filter(v => v.status === 'active').length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет активных вакансий</p>
                <Link to="/employer/vacancies">
                  <Button size="sm" className="mt-3">Создать вакансию</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
