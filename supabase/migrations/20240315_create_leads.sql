-- Migration to create leads table and related logic
-- Location: supabase/migrations/20240315_create_leads.sql

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido')),
    source TEXT,
    notes TEXT,
    score INTEGER DEFAULT 0,
    potential_value NUMERIC(15, 2),
    is_hot BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own leads"
    ON public.leads FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
