-- ==========================================
-- VidStack Storage Access Policies Migration (Phase 5.3)
-- File: supabase/migrations/005_storage_policies.sql
-- ==========================================

-- 1. Ensure storage buckets exist with public access enabled
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('audio-assets', 'audio-assets', true),
    ('video-assets', 'video-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Public Read Access for Renders and Thumbnails
CREATE POLICY "Public Read for Renders and Thumbnails in video-assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'video-assets'
        AND (name LIKE 'renders/%' OR name LIKE 'thumbnails/%' OR name LIKE 'broll/%')
    );

CREATE POLICY "Public Read for Audio Files in audio-assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'audio-assets'
        AND (name LIKE 'voiceovers/%' OR name LIKE 'audio/%')
    );

-- 3. Authenticated User Insert and Update Policies
CREATE POLICY "Authenticated users can insert video-assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'video-assets');

CREATE POLICY "Authenticated users can update video-assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'video-assets')
    WITH CHECK (bucket_id = 'video-assets');

-- 4. Owner-Only Delete Policy
CREATE POLICY "Owners can delete storage objects"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (public.is_owner());
