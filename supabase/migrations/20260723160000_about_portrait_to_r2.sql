-- Move about portrait from local /media/ to Cloudflare R2 (Blob fully retired).
UPDATE public.site_content
SET
  data = jsonb_set(
    data,
    '{about,imageUrl}',
    to_jsonb(
      'https://pub-f451e2de580d495e85d97dc9d8e4fb71.r2.dev/portfolio/about/1784816328559-542a8c04.jpg'::text
    ),
    true
  ),
  updated_at = now()
WHERE id = 1
  AND coalesce(data #>> '{about,imageUrl}', '') IN ('', '/media/portrait.jpg');
