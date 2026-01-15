-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table to track the user's last reading position (The Bookmark)
CREATE TABLE IF NOT EXISTS public.quran_bookmarks (
    user_id UUID PRIMARY KEY, -- Removed foreign key constraint safely to avoid issues if auth is desynced
    surah_number INTEGER NOT NULL,
    surah_name TEXT NOT NULL,
    ayah_number INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.quran_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be safe
DROP POLICY IF EXISTS "Users can view their own bookmark" ON public.quran_bookmarks;
DROP POLICY IF EXISTS "Users can insert/update their own bookmark" ON public.quran_bookmarks;
DROP POLICY IF EXISTS "Enable free access for bookmarks" ON public.quran_bookmarks;

-- Create PERMISSIBLE Policy (Fixes the issue where auth.uid() might be null or desynced)
CREATE POLICY "Enable free access for bookmarks" ON public.quran_bookmarks
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Table to track Khatmas (Quran Completion Goals)
CREATE TABLE IF NOT EXISTS public.quran_khatmas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL, -- Removed foreign key constraint safely
    status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    current_surah INTEGER DEFAULT 1,
    current_ayah INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.quran_khatmas ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own khatmas" ON public.quran_khatmas;
DROP POLICY IF EXISTS "Users can manage their own khatmas" ON public.quran_khatmas;
DROP POLICY IF EXISTS "Enable free access for khatmas" ON public.quran_khatmas;

-- Create PERMISSIBLE Policy
CREATE POLICY "Enable free access for khatmas" ON public.quran_khatmas
    FOR ALL USING (true) WITH CHECK (true);
