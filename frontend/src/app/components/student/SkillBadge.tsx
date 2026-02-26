// Бейдж навыка с цветовым кодированием
import { X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

type SkillVariant = 'matching' | 'missing' | 'default' | 'priority-high' | 'priority-medium' | 'priority-low';

interface SkillBadgeProps {
  skill: string;
  variant?: SkillVariant;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Бейдж навыка с несколькими вариантами:
 * - matching: зелёный (навык есть у студента и требуется в вакансии)
 * - missing: красный (навык отсутствует)
 * - priority-high: оранжевый/красный (важный навык для изучения)
 * - priority-medium: жёлтый (средний приоритет)
 * - priority-low: синий (низкий приоритет)
 * - default: серый (обычный навык)
 */
export function SkillBadge({ skill, variant = 'default', onRemove, onClick, className }: SkillBadgeProps) {
  const styles: Record<SkillVariant, string> = {
    matching: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    missing: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
    default: 'bg-secondary text-secondary-foreground border-border',
    'priority-high': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
    'priority-medium': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    'priority-low': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styles[variant],
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
      onClick={onClick}
    >
      {skill}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity ml-0.5"
          aria-label={`Удалить навык ${skill}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/** Список навыков с заголовком */
export function SkillBadgeGroup({
  title,
  skills,
  variant = 'default',
  emptyText,
}: {
  title: string;
  skills: string[];
  variant?: SkillVariant;
  emptyText?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <SkillBadge key={skill} skill={skill} variant={variant} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">{emptyText || 'Нет навыков'}</p>
      )}
    </div>
  );
}