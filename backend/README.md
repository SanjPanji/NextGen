# CareerAI Backend

FastAPI бэкенд для AI-сервиса карьерного матчинга студентов и работодателей.

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Framework | FastAPI + Uvicorn |
| Database | Supabase (PostgreSQL) |
| AI матчинг | Google Gemini 1.5 Flash |
| Парсинг резюме | Groq llama-3.3-70b + pdfplumber |
| GitHub анализ | PyGithub |
| Auth | Supabase JWT + python-jose |
| Валидация | Pydantic v2 |

## Структура проекта

```
backend/
├── app/
│   ├── main.py                        # FastAPI app + CORS + роутеры
│   ├── config.py                      # Settings через pydantic-settings
│   ├── db/
│   │   └── supabase_client.py         # Supabase клиент (service key)
│   ├── middleware/
│   │   └── auth.py                    # JWT верификация + require_role()
│   ├── models/
│   │   ├── student.py                 # Pydantic модели студента
│   │   ├── vacancy.py                 # Pydantic модели вакансии
│   │   └── match.py                   # Pydantic модели матча
│   ├── services/
│   │   ├── gemini_service.py          # Gemini AI матчинг и рекомендации
│   │   ├── groq_service.py            # Groq парсинг резюме (llama-3.3-70b)
│   │   ├── github_service.py          # PyGithub анализ профиля
│   │   ├── pdf_service.py             # pdfplumber извлечение текста
│   │   └── matching_service.py        # Логика матчинга + Supabase кеш
│   └── routers/
│       ├── students.py                # 6 эндпоинтов для студентов
│       ├── employers.py               # 4 эндпоинта для работодателей
│       └── analytics.py               # 3 эндпоинта для университетов
├── requirements.txt
├── .env.example                       # Шаблон переменных окружения
└── supabase_schema.sql                # SQL схема таблиц Supabase
```

## Быстрый старт

### 1. Суpabase схема

Выполните `supabase_schema.sql` в **SQL Editor** вашего Supabase проекта.

### 2. Переменные окружения

```bash
cp .env.example .env
# Заполните .env своими ключами
```

| Переменная | Где взять |
|-----------|-----------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → PAT |
| `JWT_SECRET` | Supabase → Settings → API → JWT Secret |

### 3. Установка зависимостей

```bash
# Python 3.11+
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS  
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Запуск

```bash
# Из папки backend/
uvicorn app.main:app --reload --port 8000

# Или напрямую
python app/main.py
```

Документация API: http://localhost:8000/docs

## API Эндпоинты

### Students (Bearer токен студента)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/v1/students/profile` | Создать/обновить профиль |
| `GET` | `/api/v1/students/profile` | Получить свой профиль |
| `POST` | `/api/v1/students/upload-resume` | Загрузить PDF резюме |
| `POST` | `/api/v1/students/connect-github` | Подключить GitHub |
| `GET` | `/api/v1/students/matches` | Топ вакансий (AI матчинг) |
| `GET` | `/api/v1/students/recommendations` | AI рекомендации |

### Employers (Bearer токен работодателя)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/v1/employers/vacancies` | Создать вакансию |
| `GET` | `/api/v1/employers/vacancies` | Список вакансий |
| `PUT` | `/api/v1/employers/vacancies/{id}` | Обновить вакансию |
| `GET` | `/api/v1/employers/vacancies/{id}/candidates` | Топ кандидатов |

### Analytics (Bearer токен университета)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/v1/analytics/top-skills` | Топ навыков рынка |
| `GET` | `/api/v1/analytics/readiness` | Готовность студентов |
| `GET` | `/api/v1/analytics/trends` | Тренды по месяцам |

## Бизнес-логика

### AI матчинг с кешированием (24 часа)
```
GET /students/matches →
  1. Проверить matches в Supabase (cached_at < 24ч)
  2. Если кеш есть → вернуть кеш
  3. Если нет → Gemini анализирует каждую вакансию
  4. Результат сохраняется в matches → ответ клиенту
```

### Парсинг PDF резюме
```
POST /students/upload-resume →
  1. pdfplumber извлекает текст из PDF
  2. Groq (llama-3.3-70b) структурирует в JSON
  3. Навыки объединяются с профилем студента
  4. Файл загружается в Supabase Storage
```

### GitHub анализ
```
POST /students/connect-github →
  1. PyGithub получает публичные репозитории
  2. Анализирует языки программирования
  3. Конвертирует в список технологий
  4. Обновляет профиль студента
```
