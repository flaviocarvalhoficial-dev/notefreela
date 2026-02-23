-- Migration: Project Hub Notion-style
-- 1. Add content_blocks to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

-- 2. Create project_pages table for sub-pages
CREATE TABLE IF NOT EXISTS project_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add context columns to existing tables for bidirectional linking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_from TEXT DEFAULT 'app';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_block_id TEXT;

ALTER TABLE inbox ADD COLUMN IF NOT EXISTS created_from TEXT DEFAULT 'app';
ALTER TABLE inbox ADD COLUMN IF NOT EXISTS source_block_id TEXT;

ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS created_from TEXT DEFAULT 'app';
ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS source_block_id TEXT;

-- Enable RLS for the new table
ALTER TABLE project_pages ENABLE ROW LEVEL SECURITY;

-- Policies for project_pages
CREATE POLICY "Users can view their own project pages" ON project_pages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project pages" ON project_pages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project pages" ON project_pages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project pages" ON project_pages
    FOR DELETE USING (auth.uid() = user_id);
