// Supabase клиент — используется ТОЛЬКО для аутентификации
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * Синглтон Supabase клиента.
 * Используется для: signIn, signOut, getSession, onAuthStateChange
 * НЕ используется для: хранения данных профиля (это через API)
 */
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);
