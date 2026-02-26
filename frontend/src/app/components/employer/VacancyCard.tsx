// Карточка вакансии для работодателя
import { MapPin, Users, Calendar, Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SkillBadge } from '../student/SkillBadge';
import type { Vacancy } from '../../../lib/types';

interface VacancyCardProps {
  vacancy: Vacancy;
}

/** Карточка вакансии с кнопкой перехода к кандидатам */
export function VacancyCard({ vacancy }: VacancyCardProps) {
  const statusConfig = {
    active: { label: 'Активна', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    closed: { label: 'Закрыта', color: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700' },
    draft: { label: 'Черновик', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  };

  const status = statusConfig[vacancy.status] || statusConfig.active;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/60 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {vacancy.title}
              </h3>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{vacancy.company || 'Компания не указана'}</p>
          </div>
          {/* Кол-во кандидатов */}
          <div className="flex flex-col items-center bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-2.5 flex-shrink-0">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
              {vacancy.candidatesCount || 0}
            </span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
              кандид.
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Описание */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {vacancy.description}
        </p>

        {/* Мета */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{vacancy.location || 'Удаленно'}</span>
          </div>
          {vacancy.salary && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{vacancy.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{vacancy.employmentType || 'Полная занятость'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{vacancy.createdAt ? formatDate(vacancy.createdAt) : 'Недавно'}</span>
          </div>
        </div>

        {/* Требуемые навыки */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Требуемые навыки
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(vacancy.requiredSkills || []).slice(0, 6).map((skill) => (
              <SkillBadge key={skill} skill={skill} variant="default" />
            ))}
            {(vacancy.requiredSkills || []).length > 6 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-muted-foreground bg-muted border border-border">
                +{(vacancy.requiredSkills || []).length - 6}
              </span>
            )}
            {(!vacancy.requiredSkills || vacancy.requiredSkills.length === 0) && (
              <span className="text-xs text-muted-foreground italic">Навыки не указаны</span>
            )}
          </div>
        </div>

        {/* Кнопка */}
        <Link to={`/employer/vacancies/${vacancy.id}/candidates`}>
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white gap-2" size="sm">
            <Users className="w-4 h-4" />
            Смотреть кандидатов ({vacancy.candidatesCount})
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
