// Страница AI матчинга вакансий студента
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Search, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { MatchCard } from '../../components/student/MatchCard';
import { AILoading, MatchCardSkeleton } from '../../components/shared/LoadingSkeleton';
import { useAppStore } from '../../../lib/store';
import { getAllVacancies, getStudentProfile } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import { vacanciesToMatches } from '../../../lib/matchUtils';

export default function StudentMatches() {
  const { user } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState<'percent' | 'company' | 'missing'>('percent');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');

  // Получаем профиль студента
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: QueryKeys.studentProfile,
    queryFn: getStudentProfile,
    staleTime: 10 * 60 * 1000, // 10 минут
  });

  // Получаем все вакансии
  const { data: vacancies, isLoading: isLoadingVacancies, isError, refetch, isFetching } = useQuery({
    queryKey: ['vacancies'],
    queryFn: getAllVacancies,
    staleTime: 30 * 60 * 1000, // 30 минут
  });

  // Рассчитываем процент соответствия на клиенте
  const matches = useMemo(() => {
    if (!vacancies || !profile) return [];
    return vacanciesToMatches(vacancies, profile);
  }, [vacancies, profile]);

  const isLoading = isLoadingProfile || isLoadingVacancies;

  // Фильтрация и сортировка
  const filteredMatches = (matches || [])
    .filter((m) => {
      const matchesSearch =
        m.vacancyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMin = m.matchPercent >= minMatch;
      const matchesSkill = !selectedSkillFilter || 
        m.matchingSkills.some(s => s.toLowerCase().includes(selectedSkillFilter.toLowerCase()));
      return matchesSearch && matchesMin && matchesSkill;
    })
    .sort((a, b) => {
      if (sortBy === 'percent') return b.matchPercent - a.matchPercent;
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      if (sortBy === 'missing') return a.missingSkills.length - b.missingSkills.length;
      return 0;
    });

  const filterButtons = [
    { label: 'Все', value: 0, color: 'bg-muted text-foreground' },
    { label: '≥50%', value: 50, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
    { label: '≥75%', value: 75, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">AI Матчинг вакансий</h1>
          <p className="text-muted-foreground mt-1">
            Вакансии, подобранные AI на основе вашего профиля
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Поиск */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или компании..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Фильтр по минимальному % */}
            <div className="flex gap-2">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setMinMatch(btn.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    minMatch === btn.value
                      ? 'border-indigo-500 ring-1 ring-indigo-500'
                      : 'border-border hover:border-indigo-300'
                  } ${btn.color}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Сортировка */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'percent' | 'company' | 'missing')}
              className="px-3 py-1.5 rounded-lg border bg-background text-sm cursor-pointer"
            >
              <option value="percent">По совпадению ↓</option>
              <option value="company">По компании</option>
              <option value="missing">По недостающим</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Состояния загрузки / ошибки */}
      {(isLoading || isFetching) && (
        <div className="space-y-4">
          <AILoading message="AI анализирует ваш профиль и ищет вакансии..." />
          {!isLoading && [1, 2, 3].map(i => <MatchCardSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Ошибка загрузки матчинга</h3>
            <p className="text-muted-foreground text-sm mt-1">Проверьте подключение и попробуйте снова</p>
          </div>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Повторить попытку
          </Button>
        </div>
      )}

      {/* Список совпадений */}
      {!isLoading && !isFetching && !isError && (
        <>
          {/* Статистика по совпадениям */}
          {matches && matches.length > 0 && (
            <Card className="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/30 dark:via-violet-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{matches.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Всего вакансий</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {matches.filter(m => m.matchPercent >= 75).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Отличных (≥75%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {matches.filter(m => m.matchPercent >= 50 && m.matchPercent < 75).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Хороших (50-74%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
                      {Math.round(matches.reduce((sum, m) => sum + m.matchPercent, 0) / matches.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Средний матч</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Счётчик результатов */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Найдено: <span className="font-semibold text-foreground">{filteredMatches.length}</span> вакансий
              {minMatch > 0 && ` с совпадением ≥${minMatch}%`}
            </p>
            {matches && matches.length > 0 && (
              <p className="text-xs text-muted-foreground">
                🔄 Кеш: 30 мин · Обновить профиль для перерасчёта
              </p>
            )}
          </div>

          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : matches && matches.length > 0 ? (
            <div className="text-center py-12 space-y-3">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="font-medium">Нет вакансий с такими фильтрами</p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setMinMatch(0); }}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Заполните профиль для AI матчинга</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Добавьте навыки, и AI подберёт подходящие вакансии
                </p>
              </div>
              <Link to="/student/profile">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                  Заполнить профиль
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}