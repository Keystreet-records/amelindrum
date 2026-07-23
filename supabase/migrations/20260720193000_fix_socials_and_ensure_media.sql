-- NOTE: storage.buckets 'site-media' is legacy.
-- Media uploads now use Cloudflare R2 (see src/routes/api/upload.ts).
-- This INSERT is harmless if left; new projects can skip this migration.

-- Ensure public media bucket exists (idempotent with earlier site_media migration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Fix bad CMS social URLs: @handles → https, "#" → empty (hide)
UPDATE public.site_content
SET
  data = jsonb_set(
    data,
    '{contact,socials}',
    (
      SELECT COALESCE(jsonb_agg(
        CASE
          WHEN lower(s->>'label') = 'telegram'
            AND coalesce(s->>'url', '') ~ '^@'
            THEN jsonb_build_object(
              'label', s->>'label',
              'url', 'https://t.me/' || ltrim(s->>'url', '@')
            )
          WHEN lower(s->>'label') = 'instagram'
            AND (
              coalesce(trim(s->>'url'), '') IN ('', '#')
              OR coalesce(s->>'url', '') ~ '^@'
            )
            THEN jsonb_build_object(
              'label', s->>'label',
              'url',
              CASE
                WHEN coalesce(s->>'url', '') ~ '^@'
                  THEN 'https://instagram.com/' || ltrim(s->>'url', '@')
                ELSE 'https://instagram.com/amelindrums'
              END
            )
          WHEN coalesce(trim(s->>'url'), '') = '#'
            THEN jsonb_build_object('label', s->>'label', 'url', '')
          ELSE s
        END
      ), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(data->'contact'->'socials', '[]'::jsonb)) AS s
    )
  ),
  updated_at = now()
WHERE id = 1;
