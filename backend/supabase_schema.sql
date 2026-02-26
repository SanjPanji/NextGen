-- ============================================================
-- CareerAI — SQL схема Supabase
-- Выполните все запросы в SQL Editor Supabase
-- ============================================================

-- --------- profiles (расширение auth.users) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'employer', 'university')),
    organization TEXT,  -- название компании или вуза
    name        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Автоматически создаём профиль при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, name, organization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'organization'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- --------- student_profiles ----------
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL DEFAULT '',
    university          TEXT DEFAULT '',
    specialty           TEXT DEFAULT '',
    skills              TEXT[] DEFAULT '{}',
    technologies        TEXT[] DEFAULT '{}',
    experience_text     TEXT,
    github_url          TEXT,
    resume_url          TEXT,
    career_interests    TEXT[] DEFAULT '{}',
    profile_completion  INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- --------- vacancies ----------
CREATE TABLE IF NOT EXISTS public.vacancies (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,
    company                 TEXT,
    description             TEXT NOT NULL DEFAULT '',
    required_skills         TEXT[] DEFAULT '{}',
    required_technologies   TEXT[] DEFAULT '{}',
    experience_years        INTEGER DEFAULT 0,
    soft_skills             TEXT[] DEFAULT '{}',
    salary_from             INTEGER,
    salary_to               INTEGER,
    salary_raw              TEXT,
    location                TEXT,
    employment_type         TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);


-- --------- matches (кеш AI матчинга) ----------
CREATE TABLE IF NOT EXISTS public.matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vacancy_id      UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
    match_percent   INTEGER NOT NULL DEFAULT 0 CHECK (match_percent >= 0 AND match_percent <= 100),
    strong_skills   TEXT[] DEFAULT '{}',
    missing_skills  TEXT[] DEFAULT '{}',
    explanation     TEXT DEFAULT '',
    cached_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, vacancy_id)
);

-- Индекс для быстрой фильтрации по времени кеша
CREATE INDEX IF NOT EXISTS idx_matches_cached_at ON public.matches(cached_at);
CREATE INDEX IF NOT EXISTS idx_matches_student_vacancy ON public.matches(student_id, vacancy_id);


-- --------- skill_history (история навыков студента) ----------
CREATE TABLE IF NOT EXISTS public.skill_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skills          TEXT[] DEFAULT '{}',
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_skill_history_student_date ON public.skill_history(student_id, snapshot_date);


-- ============================================================
-- RLS политики (Row Level Security)
-- ============================================================

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_history ENABLE ROW LEVEL SECURITY;

-- profiles: каждый видит свой профиль
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

-- student_profiles: студент видит только свой профиль
CREATE POLICY "student_own_profile" ON public.student_profiles FOR ALL USING (auth.uid() = user_id);

-- vacancies: работодатель управляет своими вакансиями, все могут читать активные
CREATE POLICY "vacancies_read_active" ON public.vacancies FOR SELECT USING (is_active = TRUE OR auth.uid() = employer_id);
CREATE POLICY "vacancies_employer_manage" ON public.vacancies FOR ALL USING (auth.uid() = employer_id);

-- matches: студент видит свои матчи, работодатель через vacancy
CREATE POLICY "matches_student" ON public.matches FOR ALL USING (auth.uid() = student_id);

-- skill_history: студент видит свою историю
CREATE POLICY "skill_history_own" ON public.skill_history FOR ALL USING (auth.uid() = student_id);


-- ============================================================
-- Supabase Storage bucket для резюме
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Политика: студент может загружать в свою папку
CREATE POLICY "resume_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resume_read_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
