-- LEGACY: Supabase Storage bucket for site media.
-- Current stack uses Cloudflare R2 — do not rely on this for new setups.
-- Kept for projects that already applied it.

-- Public media bucket for site assets (about portrait, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
CREATE POLICY "Anyone can view site-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-media');

-- Admin write
CREATE POLICY "Admins can upload site-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update site-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete site-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);
