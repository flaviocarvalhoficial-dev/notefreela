-- Migration: Add social media columns to growth_results
ALTER TABLE public.growth_results 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT;
