-- =============================================================
-- NoteFreela — Migration: Add Missing Columns
-- Execute this in your Supabase SQL Editor
-- =============================================================

-- 1. tasks: add billing_period for monthly period filter
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS billing_period TEXT;

-- 2. tasks: add start_time and end_time for calendar/agenda views
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT '09:00';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_time TEXT DEFAULT '10:00';

-- 3. projects: add avatar_emoji for project icon picker
ALTER TABLE projects ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT 'Briefcase';

-- 4. projects: add manager_name for project manager field
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_name TEXT;

-- =============================================================
-- After running this, reload the Supabase schema cache by:
-- Going to Settings > API and clicking "Reload schema"
-- Or by executing: NOTIFY pgrst, 'reload schema';
-- =============================================================
NOTIFY pgrst, 'reload schema';
