// Страница AI рекомендаций для студента с графиками
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, Bot, Sparkles } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { RecommendationCard, CareerDirectionCard } from '../../components/student/RecommendationCard';
import { AILoading } from '../../components/shared/LoadingSkeleton';
import { getStudentRecommendations } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';

// Кастомный тултип для графика
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}{entry.name.includes('%') ? '' : ' навыков'}</span>
        </p>
      ))}
    </div>
  );
};

export default function StudentRecommendations() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: QueryKeys.studentRecommendations,
    queryFn: getStudentRecommendations,
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading || isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">AI Рекомендации</h1>
          <p className="text-muted-foreground mt-1">Персональный план развития карьеры</p>
        </div>
        <AILoading message="AI строит персональный план развития..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 space-y-4">
        <Bot className="w-16 h-16 mx-auto text-muted-foreground/40" />
        <h3 className="font-semibold">Ошибка загрузки рекомендаций</h3>
        <Button onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">AI Рекомендации</h1>
          <p className="text-muted-foreground mt-1">Персональный план развития карьеры</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 flex-shrink-0">
          <RefreshCw className="w-4 h-4" />
          Обновить
        </Button>
      </div>

      {/* AI Саммари */}
      {data.summary && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300">AI анализ вашего профиля</p>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{data.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Топ-3 навыка для изучения */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">Топ-3 навыка для изучения</h2>
          <span className="text-xs bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
            AI рекомендация
          </span>
        </div>
        {data.topSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topSkills.map((skill, index) => (
              <RecommendationCard key={skill.skill} recommendation={skill} rank={index + 1} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              <p>Все высококонкурентные навыки уже есть в вашем профиле! 🎉</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Карьерные направления */}
      <div>
        <h2 className="text-lg font-bold mb-4">Рекомендуемые карьерные направления</h2>
        {data.careerDirections.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {data.careerDirections.map((direction, index) => (
              <CareerDirectionCard key={direction.title} direction={direction} rank={index + 1} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              <p>Обновите профиль для получения карьерных рекомендаций</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* График истории роста навыков */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">История роста навыков</h2>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">
              Динамика роста количества навыков и среднего % совпадения за 6 месяцев
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={data.skillHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="skillsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="skills"
                  orientation="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'dataMax + 2']}
                />
                <YAxis
                  yAxisId="match"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <Area
                  yAxisId="skills"
                  type="monotone"
                  dataKey="skillsCount"
                  name="Навыки"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#skillsGrad)"
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  yAxisId="match"
                  type="monotone"
                  dataKey="avgMatchPercent"
                  name="Совпадение %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#matchGrad)"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Итог по графику */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            {
              label: 'Рост навыков',
              value: data.skillHistory.length > 1
                ? `+${(data.skillHistory[data.skillHistory.length - 1].skillsCount - data.skillHistory[0].skillsCount)}`
                : '—',
              sub: 'за 6 месяцев',
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-950/30',
            },
            {
              label: 'Рост матчинга',
              value: data.skillHistory.length > 1
                ? `+${data.skillHistory[data.skillHistory.length - 1].avgMatchPercent - data.skillHistory[0].avgMatchPercent}%`
                : '—',
              sub: 'за 6 месяцев',
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 ${item.bg}`}>
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
