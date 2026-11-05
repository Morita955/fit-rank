import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-supabase-project-id.supabase.co'
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL ou Anon Key não foram configurados no arquivo .env.\n' +
    'Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao seu arquivo .env para conectar ao seu banco Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
