-- ==========================================
-- VidStack Audio Storage Setup Migration (Phase 4.2)
-- File: supabase/migrations/002_audio_storage.sql
-- ==========================================

-- 1. Create storage bucket 'audio-assets' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-assets', 'audio-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS Policies: Give authenticated users read/write permissions
CREATE POLICY "Public Read Access for Audio Assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'audio-assets');

CREATE POLICY "Authenticated Users Can Upload Audio Assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'audio-assets');

CREATE POLICY "Authenticated Users Can Update Audio Assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'audio-assets')
    WITH CHECK (bucket_id = 'audio-assets');

CREATE POLICY "Owners Can Delete Audio Assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'audio-assets' AND public.is_owner());
