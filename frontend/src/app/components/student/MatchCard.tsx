// Карточка совпадения вакансии с AI объяснением
import { MapPin, DollarSign, Briefcase, Bot, Building2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ProgressBar, CircularProgress } from '../shared/ProgressBar';
import { SkillBadge } from './SkillBadge';
import type { VacancyMatch } from '../../../lib/types';

interface MatchCardProps {
  match: VacancyMatch;
}

/**
 * Карточка матча студента с вакансией.
 * Показывает: название, компания, % совпадения, навыки, AI объяснение.
 */
export function MatchCard({ match }: MatchCardProps) {
  // Цветовой статус совпадения
  const getMatchLabel = (percent: number) => {
    if (percent >= 75) return { label: 'Отличное совпадение', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    if (percent >= 50) return { label: 'Хорошее совпадение', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    return { label: 'Слабое совпадение', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' };
  };

  const matchStatus = getMatchLabel(match.matchPercent);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 group relative">
      {/* Бейдж процента в углу */}
      <div className="absolute top-3 right-3 z-10">
        <div className={`px-2.5 py-1 rounded-full text-xs font-black border-2 border-background shadow-sm ${matchStatus.bg} ${matchStatus.color}`}>
          {match.matchPercent}% матч
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Левая часть: заголовок */}
          <div className="flex-1 min-w-0 pr-20">
            <h3 className="font-semibold text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {match.vacancyTitle}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground font-medium">{match.company}</span>
            </div>
          </div>
        </div>

        {/* Мета-информация */}
        <div className="flex flex-wrap gap-3 mt-2">
          {match.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{match.location}</span>
            </div>
          )}
          {match.salary && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              <span>{match.salary}</span>
            </div>
          )}
          {match.employmentType && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3" />
              <span>{match.employmentType}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Прогресс-бар */}
        <ProgressBar
          value={match.matchPercent}
          showLabel
          label="Совпадение профиля"
          size="md"
        />

        <Separator />

        {/* Навыки */}
        <div className="grid grid-cols-1 gap-3">
          {match.matchingSkills.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                ✓ Совпадающие навыки ({match.matchingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {match.matchingSkills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} variant="matching" />
                ))}
              </div>
            </div>
          )}

          {match.missingSkills.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                ✗ Недостающие навыки ({match.missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} variant="missing" />
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* AI Объяснение */}
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3 border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wide">
                AI объяснение
              </p>
              <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                {match.aiExplanation}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}