-- Migration to create service_types table
-- Location: supabase/migrations/20240316_create_service_types.sql

CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own service types"
    ON public.service_types FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS service_types_user_id_idx ON public.service_types(user_id);

-- Function to seed default service types
CREATE OR REPLACE FUNCTION public.seed_default_service_types(target_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.service_types (user_id, name, label, is_default)
    VALUES 
        (target_user_id, 'social_media', 'Social Media', true),
        (target_user_id, 'web_site', 'Web site', true),
        (target_user_id, 'app_web', 'App web', true),
        (target_user_id, 'app_mobile', 'App mobile', true),
        (target_user_id, 'video', 'Video', true),
        (target_user_id, 'fotografia_ia', 'Ensaio de fotografia com IA', true)
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
