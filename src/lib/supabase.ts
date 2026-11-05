import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('seu-projeto') &&
  !rawUrl.includes('your-supabase') &&
  rawUrl.startsWith('https://')
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://fitrank-demo.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'fitrank-demo-key';

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado com credenciais válidas.\n' +
    'Modo local ativo: Seus treinos e metas serão salvos no armazenamento local do seu dispositivo.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
