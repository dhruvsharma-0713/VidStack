-- ==========================================
-- VidStack Render Queue Migration (Phase 5.1)
-- File: supabase/migrations/004_generation_jobs.sql
-- ==========================================

-- 1. Create public.generation_jobs Table
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_step TEXT DEFAULT 'queued',
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    worker_id TEXT,
    created_by UUID REFERENCES public.profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS) & Policies
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select generation jobs"
    ON public.generation_jobs
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Authenticated users can insert generation jobs"
    ON public.generation_jobs
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update generation jobs"
    ON public.generation_jobs
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- 3. Trigger for updated_at column
CREATE TRIGGER update_generation_jobs_updated_at
    BEFORE UPDATE ON public.generation_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable Supabase Realtime Publication for public.generation_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;
