import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

const app = new Hono();

// Логирование всех запросов
app.use('*', logger(console.log));

// CORS для всех маршрутов
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "X-Total-Count"],
  maxAge: 3600,
}));

// ==============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================

/** Получить аутентифицированного пользователя по JWT токену */
async function getAuthUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ==============================
// HEALTH CHECK
// ==============================

app.get("/make-server-5770370e/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==============================
// AUTH — РЕГИСТРАЦИЯ
// ==============================

/**
 * POST /auth/signup
 * Создаёт пользователя с автоподтверждением email (email-сервер не настроен)
 * Роль (student/employer/university) сохраняется в user_metadata
 */
app.post("/make-server-5770370e/auth/signup", async (c) => {
  try {
    const { email, password, role, name, organization } = await c.req.json();

    if (!email || !password || !role || !name) {
      return c.json({ error: 'Обязательные поля: email, password, role, name' }, 400);
    }

    // Используем service role key для создания пользователя с автоподтверждением email
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role, name, organization: organization || '' },
      // Автоматически подтверждаем email, так как email-сервер не настроен
      email_confirm: true,
    });

    if (error) {
      console.log('Ошибка при создании пользователя в /auth/signup:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user, message: 'Пользователь успешно создан' }, 201);
  } catch (err) {
    console.log('Критическая ошибка в /auth/signup:', err);
    return c.json({ error: 'Внутренняя ошибка сервера при регистрации' }, 500);
  }
});

// ==============================
// STUDENT — ПРОФИЛЬ
// ==============================

/** GET /student/profile — получить профиль студента */
app.get("/make-server-5770370e/student/profile", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const profile = await kv.get(`student_profile:${user.id}`);

    if (!profile) {
      // Возвращаем пустой профиль для нового пользователя
      return c.json({
        id: user.id,
        userId: user.id,
        name: user.user_metadata?.name || '',
        university: '',
        specialization: '',
        skills: [],
        githubUrl: '',
        resumeUrl: '',
        profileCompleteness: 0,
      });
    }

    return c.json(profile);
  } catch (err) {
    console.log('Ошибка в GET /student/profile:', err);
    return c.json({ error: 'Ошибка получения профиля студента' }, 500);
  }
});

/** POST /student/profile — сохранить/обновить профиль студента */
app.post("/make-server-5770370e/student/profile", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const body = await c.req.json();

    // Вычисляем заполненность профиля (0-100%)
    let completeness = 0;
    if (body.name) completeness += 15;
    if (body.university) completeness += 15;
    if (body.specialization) completeness += 15;
    if (body.skills && body.skills.length >= 3) completeness += 30;
    else if (body.skills && body.skills.length > 0) completeness += 15;
    if (body.resumeUrl) completeness += 15;
    if (body.githubUrl) completeness += 10;

    const profile = {
      ...body,
      id: user.id,
      userId: user.id,
      profileCompleteness: Math.min(completeness, 100),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`student_profile:${user.id}`, profile);
    return c.json(profile);
  } catch (err) {
    console.log('Ошибка в POST /student/profile:', err);
    return c.json({ error: 'Ошибка сохранения профиля студента' }, 500);
  }
});

// ==============================
// STUDENT — AI МАТЧИНГ ВАКАНСИЙ
// ==============================

/** GET /student/matches — AI матчинг вакансий на основе профиля студента */
app.get("/make-server-5770370e/student/matches", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const profile = await kv.get(`student_profile:${user.id}`) as Record<string, unknown> | null;
    const userSkills: string[] = (profile?.skills as string[]) || [];

    // Mock AI матчинг — в продакшене это FastAPI endpoint с ML моделью
    const allVacancies = [
      {
        id: '1',
        vacancyTitle: 'Senior Frontend Developer',
        company: 'Яндекс',
        requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'GraphQL', 'Jest'],
        aiExplanation: 'Ваш стек React/TypeScript идеально совпадает с требованиями вакансии. Знание GraphQL повысит шансы принятия на 15%. Яндекс ценит опыт с TypeScript и современными паттернами разработки.',
        salary: '150,000 – 300,000 ₽/мес',
        location: 'Москва / Удалённо',
        employmentType: 'Полная занятость',
      },
      {
        id: '2',
        vacancyTitle: 'Backend Developer (Python)',
        company: 'Тинькофф',
        requiredSkills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'Git'],
        aiExplanation: 'Хорошие навыки Python и SQL соответствуют требованиям. Для полного соответствия необходимо изучить инструменты контейнеризации Docker и Redis, которые активно используются в инфраструктуре Тинькофф.',
        salary: '150,000 – 250,000 ₽/мес',
        location: 'Москва',
        employmentType: 'Полная занятость',
      },
      {
        id: '3',
        vacancyTitle: 'Full Stack Developer',
        company: 'VK',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'GraphQL', 'Docker'],
        aiExplanation: 'Сильная база Frontend. VK ищет универсальных разработчиков с Backend-экспертизой. Изучение Node.js и NoSQL баз данных значительно повысит ваш рейтинг в этой компании.',
        salary: '120,000 – 220,000 ₽/мес',
        location: 'Москва / Санкт-Петербург',
        employmentType: 'Полная занятость',
      },
      {
        id: '4',
        vacancyTitle: 'Data Scientist',
        company: 'Сбербанк',
        requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL', 'Statistics'],
        aiExplanation: 'Базовые навыки программирования есть, но Data Science требует специализации в ML/AI. Сбербанк инвестирует в ИИ-направление, и развитие этих навыков откроет перспективные возможности.',
        salary: '180,000 – 320,000 ₽/мес',
        location: 'Москва',
        employmentType: 'Полная занятость',
      },
      {
        id: '5',
        vacancyTitle: 'DevOps Engineer',
        company: 'Mail.ru Group',
        requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux'],
        aiExplanation: 'Эта роль требует глубоких DevOps-навыков, которые существенно отличаются от вашего текущего профиля. Рекомендуем сначала сфокусироваться на более близких направлениях и изучать DevOps параллельно.',
        salary: '200,000 – 380,000 ₽/мес',
        location: 'Москва / Удалённо',
        employmentType: 'Полная занятость',
      },
    ];

    // Вычисляем процент совпадения для каждой вакансии
    const matches = allVacancies.map((vacancy) => {
      const matchingSkills = userSkills.filter(s => vacancy.requiredSkills.includes(s));
      const missingSkills = vacancy.requiredSkills.filter(s => !userSkills.includes(s));

      let matchPercent = userSkills.length === 0
        ? Math.floor(Math.random() * 30) + 20 // Случайный базовый процент для пустого профиля
        : Math.round((matchingSkills.length / vacancy.requiredSkills.length) * 100);

      // Небольшая рандомизация для реализма
      matchPercent = Math.min(98, Math.max(10, matchPercent));

      return {
        id: vacancy.id,
        vacancyTitle: vacancy.vacancyTitle,
        company: vacancy.company,
        matchPercent,
        matchingSkills,
        missingSkills,
        aiExplanation: vacancy.aiExplanation,
        salary: vacancy.salary,
        location: vacancy.location,
        employmentType: vacancy.employmentType,
      };
    });

    // Сортируем по убыванию процента совпадения
    matches.sort((a, b) => b.matchPercent - a.matchPercent);
    return c.json(matches);
  } catch (err) {
    console.log('Ошибка в GET /student/matches:', err);
    return c.json({ error: 'Ошибка получения матчинга вакансий' }, 500);
  }
});

// ==============================
// STUDENT — AI РЕКОМЕНДАЦИИ
// ==============================

/** GET /student/recommendations — персонализированные AI рекомендации */
app.get("/make-server-5770370e/student/recommendations", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const profile = await kv.get(`student_profile:${user.id}`) as Record<string, unknown> | null;
    const userSkills: string[] = (profile?.skills as string[]) || [];

    // Все высококонкурентные навыки рынка труда
    const allHighDemandSkills = [
      { skill: 'TypeScript', demand: 89, priority: 'high', explanation: 'TypeScript используется в 89% Frontend-вакансий. Изучение займёт 2-3 месяца и увеличит ваш match rate на 23%.', resources: ['typescriptlang.org', 'Execute Program', 'TypeScript Handbook на GitHub'] },
      { skill: 'Docker', demand: 78, priority: 'high', explanation: 'Контейнеризация требуется в 78% современных вакансий. Docker — ключевой навык для продакшн разработки любого стека.', resources: ['docs.docker.com', 'Docker Deep Dive (книга Найджела Поултона)', 'Play with Docker (бесплатная практика)'] },
      { skill: 'GraphQL', demand: 65, priority: 'medium', explanation: 'GraphQL активно заменяет REST в крупных компаниях. Знание GraphQL откроет доступ к 65% вакансий в стартапах и tech-компаниях.', resources: ['graphql.org/learn', 'Apollo Odyssey (бесплатный курс)', 'How to GraphQL'] },
      { skill: 'Kubernetes', demand: 62, priority: 'medium', explanation: 'Оркестрация контейнеров критична для Senior позиций и DevOps. Повысит привлекательность профиля для крупных компаний.', resources: ['kubernetes.io/docs', 'Kubernetes: Up and Running (книга)', 'CNCF Interactive Tutorials'] },
      { skill: 'Machine Learning', demand: 71, priority: 'high', explanation: 'AI/ML — самое быстрорастущее направление в IT. Даже базовые знания ML значительно расширяют карьерные возможности.', resources: ['fast.ai (бесплатный практический курс)', 'Coursera ML Specialization', 'Kaggle Learn'] },
      { skill: 'Redis', demand: 58, priority: 'medium', explanation: 'Кеширование и работа с очередями через Redis — важный навык для Backend-разработчиков. Требуется в 58% вакансий.', resources: ['redis.io/learn', 'Redis University (бесплатно)', 'Redis in Action (книга)'] },
      { skill: 'React', demand: 86, priority: 'high', explanation: 'React — лидер среди Frontend фреймворков. Требуется в 86% вакансий Frontend-разработчиков.', resources: ['react.dev', 'Scrimba React Course', 'Epic React (Kent C. Dodds)'] },
      { skill: 'Python', demand: 95, priority: 'high', explanation: 'Python — самый универсальный язык для Backend, Data Science и AI. Знание открывает доступ к 95% нетехнических вакансий.', resources: ['python.org/about/gettingstarted', 'Automate the Boring Stuff (бесплатно)', 'Talk Python Training'] },
    ];

    // Рекомендуем скиллы, которых нет в профиле пользователя
    const topSkills = allHighDemandSkills
      .filter(s => !userSkills.includes(s.skill))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 3);

    const recommendations = {
      topSkills,
      careerDirections: [
        { title: 'Frontend разработчик', description: 'Создание интерфейсов и пользовательского опыта. Идеальное совпадение с текущим стеком технологий.', matchPercent: 87, avgSalary: '150,000 – 300,000 ₽/мес' },
        { title: 'Full Stack разработчик', description: 'Разработка как клиентской, так и серверной части приложений. Требует расширени�� Backend-навыков.', matchPercent: 65, avgSalary: '180,000 – 350,000 ₽/мес' },
        { title: 'DevOps Engineer', description: 'Автоматизация развёртывания и управление инфраструктурой. Потребует полного изучения облачных технологий.', matchPercent: 32, avgSalary: '200,000 – 400,000 ₽/мес' },
      ],
      skillHistory: [
        { month: 'Авг', skillsCount: 5, avgMatchPercent: 42 },
        { month: 'Сен', skillsCount: 6, avgMatchPercent: 51 },
        { month: 'Окт', skillsCount: 7, avgMatchPercent: 58 },
        { month: 'Ноя', skillsCount: 8, avgMatchPercent: 64 },
        { month: 'Дек', skillsCount: Math.max(userSkills.length, 9), avgMatchPercent: 71 },
        { month: 'Янв', skillsCount: Math.max(userSkills.length, 10), avgMatchPercent: 79 },
      ],
      summary: `На основе анализа вашего профиля и ${userSkills.length} навыков AI определил топ-3 направления для карьерного роста. Фокус на TypeScript и Docker даст наибольший прирост в матчинге с вакансиями.`,
    };

    return c.json(recommendations);
  } catch (err) {
    console.log('Ошибка в GET /student/recommendations:', err);
    return c.json({ error: 'Ошибка получения рекомендаций' }, 500);
  }
});

// ==============================
// EMPLOYER — ВАКАНСИИ
// ==============================

/** GET /employer/vacancies — список вакансий работодателя */
app.get("/make-server-5770370e/employer/vacancies", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const vacancies = await kv.get(`employer_vacancies:${user.id}`) as unknown[];

    if (!vacancies || vacancies.length === 0) {
      // Mock вакансии для демонстрации
      return c.json([
        { id: '1', title: 'Senior Frontend Developer', company: user.user_metadata?.organization || 'ТехКорп', description: 'Ищем опытного Frontend разработчика с глубоким знанием React и TypeScript.', requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'GraphQL', 'Jest'], salary: '150,000 – 300,000 ₽/мес', location: 'Москва / Удалённо', employmentType: 'Полная занятость', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), candidatesCount: 12, status: 'active' },
        { id: '2', title: 'Backend Python Developer', company: user.user_metadata?.organization || 'ТехКорп', description: 'Разработка микросервисной архитектуры на Python/FastAPI.', requiredSkills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'Kubernetes'], salary: '150,000 – 250,000 ₽/мес', location: 'Москва', employmentType: 'Полная занятость', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), candidatesCount: 8, status: 'active' },
        { id: '3', title: 'Data Scientist', company: user.user_metadata?.organization || 'ТехКорп', description: 'Разработка ML-моделей для анализа пользовательского поведения.', requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL', 'Statistics'], salary: '180,000 – 320,000 ₽/мес', location: 'Москва', employmentType: 'Полная занятость', createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), candidatesCount: 15, status: 'active' },
        { id: '4', title: 'DevOps Engineer', company: user.user_metadata?.organization || 'ТехКорп', description: 'Поддержка CI/CD pipeline и управление облачной инфраструктурой.', requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux'], salary: '200,000 – 380,000 ₽/мес', location: 'Удалённо', employmentType: 'Полная занятость', createdAt: new Date(Date.now() - 86400000 * 21).toISOString(), candidatesCount: 6, status: 'active' },
      ]);
    }

    return c.json(vacancies);
  } catch (err) {
    console.log('Ошибка в GET /employer/vacancies:', err);
    return c.json({ error: 'Ошибка получения вакансий' }, 500);
  }
});

/** POST /employer/vacancies — создать новую вакансию */
app.post("/make-server-5770370e/employer/vacancies", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    const body = await c.req.json();
    const existingVacancies = (await kv.get(`employer_vacancies:${user.id}`) as unknown[]) || [];

    const newVacancy = {
      ...body,
      id: Date.now().toString(),
      company: user.user_metadata?.organization || 'Компания',
      createdAt: new Date().toISOString(),
      candidatesCount: 0,
      status: 'active',
    };

    const updatedVacancies = [...existingVacancies, newVacancy];
    await kv.set(`employer_vacancies:${user.id}`, updatedVacancies);

    return c.json(newVacancy, 201);
  } catch (err) {
    console.log('Ошибка в POST /employer/vacancies:', err);
    return c.json({ error: 'Ошибка создания вакансии' }, 500);
  }
});

/** GET /employer/vacancies/:id/candidates — кандидаты для конкретной вакансии */
app.get("/make-server-5770370e/employer/vacancies/:id/candidates", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    // Mock кандидаты с AI матчингом — в продакшене это ML модель
    const candidates = [
      { id: '1', name: 'Александр Иванов', university: 'МГУ им. Ломоносова', specialization: 'Прикладная математика и CS', matchPercent: 92, matchingSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'GraphQL', 'Jest'], missingSkills: [], email: 'a.ivanov@mgu.ru', skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'GraphQL', 'Jest', 'Git'], githubUrl: 'github.com/a-ivanov', avgGrade: 4.8 },
      { id: '2', name: 'Мария Петрова', university: 'МГТУ им. Баумана', specialization: 'Программная инженерия', matchPercent: 85, matchingSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Jest'], missingSkills: ['GraphQL'], email: 'm.petrova@bmstu.ru', skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git', 'Node.js', 'Jest'], githubUrl: 'github.com/m-petrova', avgGrade: 4.6 },
      { id: '3', name: 'Дмитрий Сидоров', university: 'НИУ ВШЭ', specialization: 'Информатика и ВТ', matchPercent: 78, matchingSkills: ['React', 'JavaScript', 'CSS', 'Jest'], missingSkills: ['TypeScript', 'GraphQL'], email: 'd.sidorov@hse.ru', skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git', 'Vue.js', 'Jest'], githubUrl: 'github.com/d-sidorov', avgGrade: 4.4 },
      { id: '4', name: 'Анна Козлова', university: 'СПбГУ', specialization: 'Математика и CS', matchPercent: 71, matchingSkills: ['React', 'JavaScript', 'CSS'], missingSkills: ['TypeScript', 'GraphQL', 'Jest'], email: 'a.kozlova@spbu.ru', skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Python', 'SQL'], githubUrl: 'github.com/a-kozlova', avgGrade: 4.5 },
      { id: '5', name: 'Иван Новиков', university: 'ИТМО', specialization: 'Информационные технологии', matchPercent: 65, matchingSkills: ['JavaScript', 'CSS', 'HTML'], missingSkills: ['React', 'TypeScript', 'GraphQL', 'Jest'], email: 'i.novikov@itmo.ru', skills: ['JavaScript', 'CSS', 'HTML', 'Vue.js', 'PHP', 'MySQL'], githubUrl: 'github.com/i-novikov', avgGrade: 4.2 },
      { id: '6', name: 'Елена Морозова', university: 'МАИ', specialization: 'Информационные системы', matchPercent: 58, matchingSkills: ['JavaScript', 'HTML', 'CSS'], missingSkills: ['React', 'TypeScript', 'GraphQL', 'Jest'], email: 'e.morozova@mai.ru', skills: ['JavaScript', 'HTML', 'CSS', 'Python', 'SQL', 'Git'], avgGrade: 4.0 },
      { id: '7', name: 'Сергей Лебедев', university: 'МФТИ', specialization: 'Прикладная физика и математика', matchPercent: 49, matchingSkills: ['JavaScript', 'CSS'], missingSkills: ['React', 'TypeScript', 'GraphQL', 'Jest', 'CSS-in-JS'], email: 's.lebedev@phystech.ru', skills: ['Python', 'C++', 'JavaScript', 'MATLAB', 'Git', 'SQL'], avgGrade: 4.7 },
      { id: '8', name: 'Ольга Воробьева', university: 'МГУПИ', specialization: 'Прикладная информатика', matchPercent: 34, matchingSkills: ['HTML', 'CSS'], missingSkills: ['React', 'TypeScript', 'JavaScript ES6+', 'GraphQL', 'Jest'], email: 'o.vorobyeva@mguppi.ru', skills: ['HTML', 'CSS', 'SQL', 'Java', 'Git', 'Bootstrap'], avgGrade: 4.1 },
    ];

    return c.json(candidates);
  } catch (err) {
    console.log('Ошибка в GET /employer/vacancies/:id/candidates:', err);
    return c.json({ error: 'Ошибка получения кандидатов' }, 500);
  }
});

/** GET /employer/dashboard/stats — статистика для дашборда работодателя */
app.get("/make-server-5770370e/employer/dashboard/stats", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    return c.json({
      activeVacancies: 4,
      totalCandidates: 41,
      avgMatchRate: 67,
      contactedCandidates: 12,
      recentMatches: [
        { name: 'Александр Иванов', vacancy: 'Senior Frontend Developer', matchPercent: 92, university: 'МГУ' },
        { name: 'Мария Петрова', vacancy: 'Senior Frontend Developer', matchPercent: 85, university: 'МГТУ' },
        { name: 'Дмитрий Сидоров', vacancy: 'Backend Python Developer', matchPercent: 78, university: 'НИУ ВШЭ' },
      ],
    });
  } catch (err) {
    console.log('Ошибка в GET /employer/dashboard/stats:', err);
    return c.json({ error: 'Ошибка получения статистики дашборда' }, 500);
  }
});

// ==============================
// UNIVERSITY — АНАЛИТИКА
// ==============================

/** GET /university/analytics — аналитика для дашборда университета */
app.get("/make-server-5770370e/university/analytics", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Не авторизован' }, 401);

    return c.json({
      totalStudents: 1847,
      avgMatchRate: 68,
      employedStudents: 72,
      topSkills: [
        { skill: 'Python', demand: 95 },
        { skill: 'JavaScript', demand: 91 },
        { skill: 'React', demand: 86 },
        { skill: 'SQL', demand: 82 },
        { skill: 'Docker', demand: 76 },
        { skill: 'TypeScript', demand: 71 },
        { skill: 'Machine Learning', demand: 67 },
        { skill: 'Node.js', demand: 62 },
      ],
      readinessDistribution: [
        { label: 'Готов к работе', value: 28, color: '#22c55e' },
        { label: 'Почти готов', value: 44, color: '#f59e0b' },
        { label: 'Требует обучения', value: 28, color: '#ef4444' },
      ],
      skillsGrowth: [
        { month: 'Авг', avgSkills: 6.2, avgMatch: 48, studentsCount: 1720 },
        { month: 'Сен', avgSkills: 6.8, avgMatch: 52, studentsCount: 1745 },
        { month: 'Окт', avgSkills: 7.1, avgMatch: 55, studentsCount: 1780 },
        { month: 'Ноя', avgSkills: 7.6, avgMatch: 60, studentsCount: 1800 },
        { month: 'Дек', avgSkills: 8.2, avgMatch: 65, studentsCount: 1825 },
        { month: 'Янв', avgSkills: 8.9, avgMatch: 68, studentsCount: 1847 },
      ],
    });
  } catch (err) {
    console.log('Ошибка в GET /university/analytics:', err);
    return c.json({ error: 'Ошибка получения аналитики' }, 500);
  }
});

Deno.serve(app.fetch);
