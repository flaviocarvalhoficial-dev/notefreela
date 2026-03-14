-- Migration: Create searches and growth_results table
CREATE TABLE IF NOT EXISTS public.growth_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    location TEXT NOT NULL,
    radius TEXT DEFAULT '5km',
    results_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.growth_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    search_id UUID REFERENCES public.growth_searches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    website TEXT,
    phone TEXT,
    rating NUMERIC(3, 1),
    reviews_count INTEGER,
    needs JSONB DEFAULT '[]'::jsonb,
    score INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'ignored')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.growth_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_results ENABLE ROW LEVEL SECURITY;

-- Policies for Searches
CREATE POLICY "Users can manage their own growth searches" ON public.growth_searches
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Results (via search ownership)
CREATE POLICY "Users can view results for their own searches" ON public.growth_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.growth_searches 
            WHERE growth_searches.id = growth_results.search_id AND growth_searches.user_id = auth.uid()
        )
    );
