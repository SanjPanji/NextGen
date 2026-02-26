// Компонент отображения % совпадения для работодателя
import { cn } from '../ui/utils';

interface MatchPercentProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  className?: string;
}

/**
 * Бейдж с % совпадения для таблицы кандидатов.
 * Цвет зависит от значения: красный/жёлтый/зелёный
 */
export function MatchPercent({ value, size = 'md', showBar = false, className }: MatchPercentProps) {
  const getStyles = (val: number) => {
    if (val >= 75) return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
      bar: 'bg-gradient-to-r from-emerald-500 to-green-500',
    };
    if (val >= 50) return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
      bar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    };
    return {
      badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
      bar: 'bg-gradient-to-r from-red-500 to-rose-500',
    };
  };

  const styles = getStyles(value);
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className={cn(
        'inline-flex items-center rounded-full border font-bold tabular-nums',
        styles.badge,
        sizeStyles[size],
      )}>
        {value}%
      </span>
      {showBar && (
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', styles.bar)}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
    </div>
  );
}