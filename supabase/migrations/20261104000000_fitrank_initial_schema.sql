-- =======================================================
-- FITRANK - SUPABASE MIGRATION (INITIAL SCHEMA)
-- =======================================================

-- 1. TABELA DE PERFIS DE USUÁRIO (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  goal_pull_ups INT DEFAULT 200,
  goal_push_ups INT DEFAULT 1000,
  goal_sit_ups INT DEFAULT 500,
  goal_running_km INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE REGISTRO DE ATIVIDADES (ACTIVITIES)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pull_ups INT DEFAULT 0,
  push_ups INT DEFAULT 0,
  sit_ups INT DEFAULT 0,
  running_km NUMERIC(8,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, date);

-- 3. TABELA DE CONEXÕES / AMIZADES (CONNECTIONS)
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE(requester_id, target_id)
);

-- =======================================================
-- AUTOMAÇÃO: TRIGGER PARA CRIAR PERFIL AO REGISTRAR NO AUTH
-- =======================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =======================================================
-- SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Qualquer usuário autenticado pode ver perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário pode criar ou atualizar seu próprio perfil"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para ACTIVITIES
CREATE POLICY "Usuário pode visualizar treinos próprios ou de amigos/ranking"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário pode criar suas próprias atividades"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar suas próprias atividades"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode excluir suas próprias atividades"
  ON public.activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para CONNECTIONS
CREATE POLICY "Usuários podem ver conexões em que estão envolvidos"
  ON public.connections FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Usuário pode criar solicitações de conexão"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Usuário pode atualizar conexões enviadas ou recebidas"
  ON public.connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Usuário pode deletar conexões"
  ON public.connections FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);
