// Карточка AI рекомендации навыка
import { BookOpen, TrendingUp, ExternalLink, Flame, Zap, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { ProgressBar } from '../shared/ProgressBar';
import type { SkillRecommendation, CareerDirection } from '../../../lib/types';

// ==============================
// КАРТОЧКА РЕКОМЕНДУЕМОГО НАВЫКА
// ==============================

interface RecommendationCardProps {
  recommendation: SkillRecommendation;
  rank: number;
}

const priorityConfig = {
  high: { label: 'Высокий приоритет', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' },
  medium: { label: 'Средний приоритет', icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
  low: { label: 'Низкий приоритет', icon: Minus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
};

export function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const priority = priorityConfig[recommendation.priority];
  const PriorityIcon = priority.icon;

  return (
    <Card className={`border-2 ${priority.bg} overflow-hidden hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Порядковый номер */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">#{rank}</span>
            </div>
            <div>
              <h3 className="font-bold text-base">{recommendation.skill}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PriorityIcon className={`w-3.5 h-3.5 ${priority.color}`} />
                <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
              </div>
            </div>
          </div>

          {/* Процент востребованности */}
          <div className="text-center flex-shrink-0">
            <p className="text-2xl font-black text-foreground">{recommendation.demand}%</p>
            <p className="text-[10px] text-muted-foreground leading-none">вакансий</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Бар востребованности */}
        <ProgressBar value={recommendation.demand} size="sm" />

        {/* Объяснение AI */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {recommendation.explanation}
        </p>

        {/* Ресурсы для изучения */}
        {recommendation.resources && recommendation.resources.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Где изучить
            </p>
            <div className="space-y-1">
              {recommendation.resources.map((resource, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span>{resource}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==============================
// КАРТОЧКА КАРЬЕРНОГО НАПРАВЛЕНИЯ
// ==============================

interface CareerDirectionCardProps {
  direction: CareerDirection;
  rank: number;
}

export function CareerDirectionCard({ direction, rank }: CareerDirectionCardProps) {
  const getColor = (percent: number) => {
    if (percent >= 75) return 'from-emerald-500 to-green-600';
    if (percent >= 50) return 'from-amber-500 to-yellow-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start gap-4">
          {/* Ранг */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getColor(direction.matchPercent)} flex items-center justify-center flex-shrink-0 shadow-md`}>
            <span className="text-white text-sm font-black">#{rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold">{direction.title}</h4>
              <span className="text-lg font-black text-foreground flex-shrink-0">{direction.matchPercent}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{direction.description}</p>
            {direction.avgSalary && (
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {direction.avgSalary}
                </span>
              </div>
            )}
            <ProgressBar value={direction.matchPercent} size="sm" className="mt-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
