// Skeleton-лоадеры для AI запросов
import { Skeleton } from '../ui/skeleton';
import { Brain, Sparkles } from 'lucide-react';

interface AILoadingProps {
  message?: string;
}

/** Полноэкранный AI лоадер с анимацией */
export function AILoading({ message = 'AI анализирует профиль...' }: AILoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">Это займёт несколько секунд</p>
      </div>
      {/* Анимированные точки */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton карточки матча вакансии */
export function MatchCardSkeleton() {
  return (
    <div className="border rounded-xl p-5 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

/** Skeleton таблицы кандидатов */
export function CandidatesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
          <div className="flex gap-1.5">
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-5 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton страницы аналитики */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-xl p-5 bg-card space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5 bg-card">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
        <div className="border rounded-xl p-5 bg-card">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Простой inline spinner */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
}
