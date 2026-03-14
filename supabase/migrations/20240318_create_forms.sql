-- Migration: Create Forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'lead' CHECK (type IN ('lead', 'briefing', 'feedback', 'custom')),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
    fields JSONB DEFAULT '[]'::jsonb, -- Store form structure/fields
    settings JSONB DEFAULT '{}'::jsonb, -- Store behavior settings (e.g., redirect URL)
    response_count INTEGER DEFAULT 0,
    last_response_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own forms" ON public.forms
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_forms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON public.forms
    FOR EACH ROW
    EXECUTE PROCEDURE update_forms_updated_at_column();

-- Create table for Form Responses
CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL, -- The actual response data
    is_viewed BOOLEAN DEFAULT false
);

-- Enable RLS for responses
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Policies for responses (via form ownership)
CREATE POLICY "Users can view responses for their own forms" ON public.form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_responses.form_id AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete responses for their own forms" ON public.form_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_responses.form_id AND forms.user_id = auth.uid()
        )
    );

-- Allow public insertion to form responses (for public forms)
CREATE POLICY "Public can submit responses" ON public.form_responses
    FOR INSERT WITH CHECK (true);

-- Update response_count and last_response_at on new response
CREATE OR REPLACE FUNCTION update_form_stats_on_response()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.forms 
    SET 
        response_count = response_count + 1,
        last_response_at = NEW.created_at
    WHERE id = NEW.form_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_form_response_insert
    AFTER INSERT ON public.form_responses
    FOR EACH ROW
    EXECUTE PROCEDURE update_form_stats_on_response();
