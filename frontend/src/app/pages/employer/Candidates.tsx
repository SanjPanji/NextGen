// Страница кандидатов для конкретной вакансии
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft, Users, SlidersHorizontal, ChevronUp, ChevronDown, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Slider } from '../../components/ui/slider';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { CandidateRow } from '../../components/employer/CandidateRow';
import { CandidatesTableSkeleton, AILoading } from '../../components/shared/LoadingSkeleton';
import { getVacancyCandidates, getEmployerVacancies } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import type { Candidate } from '../../../lib/types';

type SortField = 'matchPercent' | 'name' | 'university' | 'missingSkills';
type SortOrder = 'asc' | 'desc';

export default function EmployerCandidates() {
  const { id: vacancyId } = useParams<{ id: string }>();
  const [minPercent, setMinPercent] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('matchPercent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: QueryKeys.vacancyCandidates(vacancyId || ''),
    queryFn: () => getVacancyCandidates(vacancyId || ''),
    enabled: !!vacancyId,
  });

  const { data: vacancies } = useQuery({
    queryKey: QueryKeys.employerVacancies,
    queryFn: getEmployerVacancies,
  });

  const currentVacancy = vacancies?.find(v => v.id === vacancyId);

  // Сортировка
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'matchPercent' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3.5 h-3.5 opacity-30" />;
    return sortOrder === 'desc'
      ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
      : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />;
  };

  // Фильтрация и сортировка кандидатов
  const sortedCandidates = (candidates || [])
    .filter((c: Candidate) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.university.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && c.matchPercent >= minPercent;
    })
    .sort((a: Candidate, b: Candidate) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortField === 'matchPercent') { aVal = a.matchPercent; bVal = b.matchPercent; }
      if (sortField === 'name') { aVal = a.name; bVal = b.name; }
      if (sortField === 'university') { aVal = a.university; bVal = b.university; }
      if (sortField === 'missingSkills') { aVal = a.missingSkills.length; bVal = b.missingSkills.length; }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  // Статистика
  const avgMatch = sortedCandidates.length
    ? Math.round(sortedCandidates.reduce((sum, c) => sum + c.matchPercent, 0) / sortedCandidates.length)
    : 0;
  const excellent = sortedCandidates.filter(c => c.matchPercent >= 75).length;

  return (
    <div className="space-y-6">
      {/* Навигация */}
      <div>
        <Link to="/employer/vacancies">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Назад к вакансиям
          </Button>
        </Link>
      </div>

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black">
          {currentVacancy ? currentVacancy.title : 'Кандидаты'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentVacancy?.company} · AI матчинг кандидатов по профилям
        </p>
      </div>

      {/* Статы */}
      {!isLoading && candidates && candidates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Всего кандидатов', value: candidates.length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
            { label: 'Отличный матчинг (≥75%)', value: excellent, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Средний матчинг', value: `${avgMatch}%`, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
            { label: 'После фильтра', value: sortedCandidates.length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <Input
                placeholder="Поиск по имени или университету..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Минимальный % совпадения */}
            <div className="sm:w-72">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Мин. совпадение:</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">≥{minPercent}%</span>
              </div>
              <Slider
                min={0}
                max={90}
                step={5}
                value={[minPercent]}
                onValueChange={([val]) => setMinPercent(val)}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-end">
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Заголовки сортировки */}
      {!isLoading && sortedCandidates.length > 0 && (
        <div className="hidden md:flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div className="w-7 flex-shrink-0" />
          <div className="w-10 flex-shrink-0" />
          <button
            onClick={() => handleSort('name')}
            className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          >
            Кандидат <SortIcon field="name" />
          </button>
          <button
            onClick={() => handleSort('matchPercent')}
            className="flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Совпадение <SortIcon field="matchPercent" />
          </button>
          <button
            onClick={() => handleSort('missingSkills')}
            className="hidden md:flex items-center gap-1 hover:text-foreground transition-colors max-w-[200px]"
          >
            Недостающие <SortIcon field="missingSkills" />
          </button>
          <div className="flex items-center gap-2 flex-shrink-0 w-36" />
        </div>
      )}

      {/* Состояния */}
      {isLoading && (
        <>
          <AILoading message="AI анализирует кандидатов..." />
          <CandidatesTableSkeleton />
        </>
      )}

      {isError && !isLoading && (
        <div className="text-center py-12 space-y-4">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <h3 className="font-semibold">Ошибка загрузки кандидатов</h3>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Повторить
          </Button>
        </div>
      )}

      {/* Список кандидатов */}
      {!isLoading && !isError && (
        <>
          {sortedCandidates.length > 0 ? (
            <div className="space-y-2">
              {sortedCandidates.map((candidate, index) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <SlidersHorizontal className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="font-medium">
                {candidates && candidates.length > 0
                  ? `Нет кандидатов с совпадением ≥${minPercent}%`
                  : 'Пока нет кандидатов для этой вакансии'}
              </p>
              {candidates && candidates.length > 0 && (
                <Button variant="outline" onClick={() => { setMinPercent(0); setSearchQuery(''); }}>
                  Сбросить фильтры
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}