-- ==========================================
-- VidStack Video & B-Roll Assets Storage Migration (Phase 4.3)
-- File: supabase/migrations/003_media_storage.sql
-- ==========================================

-- 1. Create storage bucket 'video-assets' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-assets', 'video-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS Policies: Give authenticated users read/write permissions for media assets
CREATE POLICY "Public Read Access for Video Assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'video-assets');

CREATE POLICY "Authenticated Users Can Upload Video Assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'video-assets');

CREATE POLICY "Authenticated Users Can Update Video Assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'video-assets')
    WITH CHECK (bucket_id = 'video-assets');

CREATE POLICY "Owners Can Delete Video Assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'video-assets' AND public.is_owner());
