// Дашборд аналитики для университета с Recharts графиками
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Users, TrendingUp, Briefcase, GraduationCap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { AnalyticsSkeleton } from '../../components/shared/LoadingSkeleton';
import { getUniversityAnalytics } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import { useAppStore } from '../../../lib/store';

// Кастомный тултип
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl p-3 shadow-xl text-sm min-w-[140px]">
      {label && <p className="font-semibold mb-1.5 text-foreground">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}{entry.name.includes('%') ? '%' : ''}</span>
        </p>
      ))}
    </div>
  );
};

// Кастомный тултип для PieChart
const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-card border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold" style={{ color: item.payload.color }}>{item.name}</p>
      <p className="text-muted-foreground">{item.value}%</p>
    </div>
  );
};

export default function UniversityAnalytics() {
  const { user } = useAppStore();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: QueryKeys.universityAnalytics,
    queryFn: getUniversityAnalytics,
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading || isFetching) return <AnalyticsSkeleton />;

  if (isError || !data) {
    return (
      <div className="text-center py-16 space-y-4">
        <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h3 className="font-semibold">Ошибка загрузки аналитики</h3>
        <Button onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Повторить
        </Button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Всего студентов', value: data.totalStudents.toLocaleString('ru-RU'), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', sub: 'в базе данных' },
    { label: 'Средний матчинг', value: `${data.avgMatchRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', sub: 'с вакансиями рынка' },
    { label: 'Трудоустроено', value: `${data.employedStudents}%`, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', sub: 'выпускников' },
    { label: 'Готовы к работе', value: `${data.readinessDistribution[0]?.value ?? 0}%`, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', sub: 'студентов' },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Аналитика {user?.organization ? `— ${user.organization}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Дашборд готовности студентов к рынку труда
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="hover:shadow-md transition-all">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-black">{card.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
                <p className="text-[10px] text-muted-foreground/70">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart — Топ навыков рынка труда */}
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Топ востребованных навыков</h3>
            <p className="text-xs text-muted-foreground">% вакансий, требующих навык</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.topSkills}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="skill"
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                <Bar
                  dataKey="demand"
                  name="Спрос %"
                  radius={[0, 6, 6, 0]}
                  fill="url(#barGrad)"
                >
                  {data.topSkills.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.demand >= 80 ? '#6366f1' : entry.demand >= 65 ? '#8b5cf6' : '#a78bfa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PieChart — Распределение по готовности */}
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Готовность студентов к работе</h3>
            <p className="text-xs text-muted-foreground">Распределение по уровню готовности</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.readinessDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="label"
                >
                  {data.readinessDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Легенда с числами */}
            <div className="flex justify-around mt-2">
              {data.readinessDistribution.map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xl font-black" style={{ color: item.color }}>{item.value}%</p>
                  <p className="text-[10px] text-muted-foreground leading-tight max-w-[80px]">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* LineChart — Динамика улучшения навыков */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Динамика роста навыков студентов</h3>
          <p className="text-xs text-muted-foreground">
            Средние показатели за последние 6 месяцев · {data.skillsGrowth[data.skillsGrowth.length - 1]?.studentsCount.toLocaleString('ru-RU')} студентов
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data.skillsGrowth}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="skillsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                domain={[5, 10]}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <YAxis
                yAxisId="match"
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={[30, 80]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
              <ReferenceLine yAxisId="match" y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '50%', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <Line
                yAxisId="skills"
                type="monotone"
                dataKey="avgSkills"
                name="Ср. навыков"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              <Line
                yAxisId="match"
                type="monotone"
                dataKey="avgMatch"
                name="Ср. матчинг %"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              <Line
                yAxisId="skills"
                type="monotone"
                dataKey="studentsCount"
                name=""
                stroke="transparent"
                legendType="none"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Итоговые цифры */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            {[
              {
                label: 'Рост навыков',
                value: `+${((data.skillsGrowth[data.skillsGrowth.length - 1]?.avgSkills || 0) - (data.skillsGrowth[0]?.avgSkills || 0)).toFixed(1)}`,
                sub: 'ср. навыков за 6 мес.',
                color: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                label: 'Рост матчинга',
                value: `+${(data.skillsGrowth[data.skillsGrowth.length - 1]?.avgMatch || 0) - (data.skillsGrowth[0]?.avgMatch || 0)}%`,
                sub: 'средний за 6 мес.',
                color: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: 'Новых студентов',
                value: `+${((data.skillsGrowth[data.skillsGrowth.length - 1]?.studentsCount || 0) - (data.skillsGrowth[0]?.studentsCount || 0)).toLocaleString('ru-RU')}`,
                sub: 'за 6 месяцев',
                color: 'text-violet-600 dark:text-violet-400',
              },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
