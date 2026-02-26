// Прогресс-бар с цветовой кодировкой (красный/жёлтый/зелёный)
import { cn } from '../ui/utils';

interface ProgressBarProps {
  /** Процент заполнения (0-100) */
  value: number;
  /** Показать подпись с процентом */
  showLabel?: boolean;
  /** Размер (высота) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Метка слева */
  label?: string;
  /** Анимированный */
  animated?: boolean;
}

/**
 * Цветной прогресс-бар для отображения % совпадения:
 * < 50% → красный
 * 50-74% → жёлтый
 * ≥ 75% → зелёный
 */
export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  className,
  label,
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Цвет в зависимости от значения
  const getColor = (val: number) => {
    if (val >= 75) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (val >= 50) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  // Цвет текста
  const getTextColor = (val: number) => {
    if (val >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className={cn('text-sm font-bold tabular-nums', getTextColor(clampedValue))}>
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            getColor(clampedValue),
            animated && 'animate-in slide-in-from-left-full',
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

/** Круговой индикатор прогресса (для % совпадения) */
export function CircularProgress({
  value,
  size = 56,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 75) return '#22c55e';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getTextColor = (val: number) => {
    if (val >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Прогресс */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(clampedValue)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className={cn(
          'absolute text-xs font-bold tabular-nums',
          getTextColor(clampedValue),
        )}
      >
        {clampedValue}%
      </span>
    </div>
  );
}