-- TABELAS PARA O HUB PESSOAL / GESTÃO PESSOAL

-- 1. Categorias de Hábitos (Opcional, mas ajuda na organização)
CREATE TABLE IF NOT EXISTS public.habit_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide icon name
    color TEXT, -- Hex color or tailwind class
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hábitos
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.habit_categories(id) ON DELETE SET NULL,
    category TEXT, -- Para categorias virtuais/strings (ex: 'treino', 'saude')
    title TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    target_days INT DEFAULT 1, -- Para semanal/mensal: quantas vezes espera-se completar
    metadata JSONB DEFAULT '{}'::jsonb, -- Peculiaridades: horário, turno, distância, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Logs de Hábitos (Execução)
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completed_at)
);

-- 4. Acessos e Senhas (Gerenciador Simples)
CREATE TABLE IF NOT EXISTS public.personal_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    login_user TEXT,
    login_password TEXT, -- Em produção seria ideal usar criptografia, aqui faremos o básico funcional
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
    status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress_percent INT DEFAULT 0,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (POLICIES)
ALTER TABLE public.habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_courses ENABLE ROW LEVEL SECURITY;

-- Exemplo de política para Habit Categories
CREATE POLICY "Users can manage their own habit categories" ON public.habit_categories
    FOR ALL USING (auth.uid() = user_id);

-- Política para Habits
CREATE POLICY "Users can manage their own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id);

-- Política para Habit Logs
CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs
    FOR ALL USING (auth.uid() = user_id);

-- Política para Credentials
CREATE POLICY "Users can manage their own credentials" ON public.personal_credentials
    FOR ALL USING (auth.uid() = user_id);

-- Política para Courses
CREATE POLICY "Users can manage their own courses" ON public.personal_courses
    FOR ALL USING (auth.uid() = user_id);
