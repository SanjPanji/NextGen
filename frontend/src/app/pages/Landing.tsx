// Лендинг страница AI Career Matching сервиса
import { Link } from 'react-router';
import { useTheme } from 'next-themes';
import {
  Brain, Zap, Users, BarChart3, Star, ArrowRight, Check,
  GraduationCap, Building2, TrendingUp, Sparkles, Moon, Sun,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const heroImage = 'https://images.unsplash.com/photo-1664526937033-fe2c11f1be25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBjYXJlZXIlMjBtYXRjaGluZyUyMG5ldHdvcmslMjBhYnN0cmFjdHxlbnwxfHx8fDE3NzE5ODQ2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
const studentsImage = 'https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHRlY2hub2xvZ3klMjBsYXB0b3B8ZW58MXx8fHwxNzcxOTg0Njk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';

export default function Landing() {
  const { theme, setTheme } = useTheme();

  const features = [
    { icon: Brain, title: 'AI Матчинг', description: 'Нейросеть анализирует профиль студента и находит идеальные вакансии с точностью до 95%.', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { icon: TrendingUp, title: 'GitHub Анализ', description: 'Автоматический анализ репозиториев для выявления реальных навыков программирования.', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { icon: Star, title: 'Персональные советы', description: 'AI советует конкретные навыки для изучения, повышающие шансы трудоустройства.', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { icon: BarChart3, title: 'Аналитика', description: 'Университеты получают детальную аналитику готовности студентов к рынку труда.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  const roles = [
    { icon: GraduationCap, title: 'Студентам', description: 'Найди работу мечты с AI матчингом. Получи персональный план развития навыков.', color: 'from-blue-500 to-indigo-600', link: '/auth/register', cta: 'Создать профиль' },
    { icon: Building2, title: 'Работодателям', description: 'Находи идеальных кандидатов из тысяч студентов с помощью AI фильтрации.', color: 'from-violet-500 to-purple-600', link: '/auth/register', cta: 'Разместить вакансию' },
    { icon: GraduationCap, title: 'Университетам', description: 'Отслеживай готовность студентов к трудоустройству в реальном времени.', color: 'from-emerald-500 to-teal-600', link: '/auth/register', cta: 'Открыть дашборд' },
  ];

  const stats = [
    { value: '10,000+', label: 'Студентов ожидают' },
    { value: '850+', label: 'Партнёров-работодателей готовы сотрудничать' },
    { value: '94%', label: 'Точность AI матчинга' },
    { value: '3.2×', label: 'Быстрее поиска работы' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              NextGenAI
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
            <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Для кого</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Результаты</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Войти</Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white">
                Начать
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Текст */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Powered by AI · Точность матчинга 94%
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                AI находит
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  работу мечты
                </span>
                для студентов
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Платформа использует искусственный интеллект для точного матчинга
                студентов с вакансиями и персонального планирования карьеры.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 h-12 text-base">
                    <Zap className="w-4.5 h-4.5" />
                    Начать бесплатно
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base gap-2">
                    Войти в аккаунт
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Соц. доказательства */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {['АИ', 'МП', 'ДС', 'АК', 'ИН'].map((init) => (
                    <div
                      key={init}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">10,000+</span> студентов хотят победы нашего проекта
                </p>
              </div>
            </div>

            {/* Изображение */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="AI Career Matching"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 bg-card border rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI нашёл для вас</p>
                    <p className="font-bold text-sm text-emerald-600">87% совпадение — Яндекс</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card border rounded-xl p-4 shadow-xl">
                <p className="text-xs text-muted-foreground mb-0.5">Ваши навыки</p>
                <div className="flex gap-1">
                  {['React', 'TypeScript', 'Python'].map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200 dark:border-indigo-800 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section id="stats" className="py-12 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center text-white">
                <p className="text-3xl sm:text-4xl font-black">{stat.value}</p>
                <p className="text-indigo-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Как работает AI матчинг
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Передовые технологии машинного обучения анализируют сотни параметров
              для идеального совпадения студентов и работодателей.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FOR WHOM ===== */}
      <section id="roles" className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Для всех участников рынка</h2>
            <p className="text-muted-foreground text-lg">Платформа объединяет студентов, работодателей и университеты в единой экосистеме.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.title} className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{role.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">{role.description}</p>
                  <Link to={role.link}>
                    <Button className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-white gap-2`}>
                      {role.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STUDENTS IMAGE ===== */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={studentsImage}
                alt="Студенты используют CareerAI"
                className="w-full h-72 object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black">
                От студента до <br />
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  специалиста
                </span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                CareerAI помогает студентам выстроить чёткий путь к первой работе.
                AI анализирует GitHub, навыки и интересы, чтобы предложить персональный план развития.
              </p>
              <div className="space-y-3">
                {[
                  'Анализ GitHub репозиториев за 30 секунд',
                  'Персональные рекомендации по навыкам',
                  'Прямой контакт с работодателями',
                  'Отслеживание прогресса в реальном времени',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white gap-2 h-12 text-base">
                  Начать бесплатно
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center text-white space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Готов к карьерному прыжку?</h2>
          <p className="text-indigo-200 text-lg">
            Присоединяйся к нашему проекту, будьте один из первых кто начнет использовать AI для поиска работы мечты.
          </p>
          <Link to="/auth/register">
            <Button size="lg" variant="secondary" className="h-12 text-base gap-2 shadow-xl">
              <Zap className="w-4.5 h-4.5" />
              Создать аккаунт бесплатно
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-4 sm:px-6 border-t bg-card">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-sm text-muted-foreground">NextGenAI — AI Career Matching Platform</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 NextGenAI. Только для демонстрационных целей.
          </p>
        </div>
      </footer>
    </div>
  );
}
