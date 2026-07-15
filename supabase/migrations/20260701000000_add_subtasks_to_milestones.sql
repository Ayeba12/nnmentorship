-- Add subtasks column to milestones table
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb NOT NULL;
