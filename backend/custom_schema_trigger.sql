-- SQL Триггер для автоматического создания профиля (для вашей схемы)
-- Выполните этот код в Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    u_role TEXT;
    u_name TEXT;
    u_org TEXT;
BEGIN
    -- Извлекаем данные из метаданных регистрации
    u_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    u_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
    u_org := NEW.raw_user_meta_data->>'organization';

    -- 1. Вставка в основную таблицу profiles
    INSERT INTO public.profiles (id, name, role, organization)
    VALUES (NEW.id, u_name, u_role, u_org)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Вставка в дочерние таблицы в зависимости от роли
    IF u_role = 'student' THEN
        INSERT INTO public.students (id, bio, skills) 
        VALUES (NEW.id, '', '{}'::jsonb)
        ON CONFLICT (id) DO NOTHING;
    ELSIF u_role = 'employer' THEN
        INSERT INTO public.employers (id, company_name) 
        VALUES (NEW.id, COALESCE(u_org, u_name))
        ON CONFLICT (id) DO NOTHING;
    ELSIF u_role = 'university' THEN
        INSERT INTO public.universities (id, university_name) 
        VALUES (NEW.id, COALESCE(u_org, u_name))
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
