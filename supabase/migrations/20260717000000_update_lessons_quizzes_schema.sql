-- Migration to add missing columns to lessons, quizzes, and quiz_questions tables for Phase 2 curriculum updates

-- 1. Add missing columns to public.lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS section_title TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS resources JSONB;

-- 2. Add missing columns to public.quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS max_retakes INTEGER;

-- 3. Add missing columns to public.quiz_questions table
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'multiple_choice',
ADD COLUMN IF NOT EXISTS correct_short_answer TEXT;

-- 4. Make options and correct_index nullable in public.quiz_questions
-- (Since short_answer questions do not use options or correct_index)
ALTER TABLE public.quiz_questions 
ALTER COLUMN options DROP NOT NULL,
ALTER COLUMN correct_index DROP NOT NULL;
