-- SCRIPT DE REPARAÇÃO E CRIAÇÃO - HUB PESSOAL
-- Execute este script no SQL Editor do Supabase

-- 0. Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categorias de Hábitos
CREATE TABLE IF NOT EXISTS public.habit_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hábitos (Com suporte a peculiaridades e categorias virtuais)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.habit_categories(id) ON DELETE SET NULL,
    category TEXT, -- Para categorias virtuais (ex: 'treino')
    title TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_days INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb, -- Para horário, turno, distância, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Logs de Hábitos
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completed_at)
);

-- 4. Acessos e Senhas
CREATE TABLE IF NOT EXISTS public.personal_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    login_user TEXT,
    login_password TEXT,
    url TEXT,
    category TEXT DEFAULT 'Geral',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cursos e Estudos
CREATE TABLE IF NOT EXISTS public.personal_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT,
    status TEXT DEFAULT 'not_started',
    progress_percent INT DEFAULT 0,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_courses ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own habit categories') THEN
        CREATE POLICY "Users can manage their own habit categories" ON public.habit_categories FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own habits') THEN
        CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own habit logs') THEN
        CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own credentials') THEN
        CREATE POLICY "Users can manage their own credentials" ON public.personal_credentials FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own courses') THEN
        CREATE POLICY "Users can manage their own courses" ON public.personal_courses FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
