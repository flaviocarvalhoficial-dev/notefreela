-- Migration to add service_type column to leads table
-- Location: supabase/migrations/20240315_add_service_type_to_leads.sql

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS service_type TEXT;
