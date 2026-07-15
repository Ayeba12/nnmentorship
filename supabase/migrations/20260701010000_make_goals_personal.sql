-- Make mentor_id and relationship_id optional in goals table to allow personal goals
ALTER TABLE public.goals ALTER COLUMN mentor_id DROP NOT NULL;
ALTER TABLE public.goals ALTER COLUMN relationship_id DROP NOT NULL;
