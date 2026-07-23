-- Clear portfolio file URLs that pointed at oversized (>100MB) blobs already deleted from Vercel Blob.
-- Safe to run once in Supabase SQL editor if CMS still references the dead URLs.

UPDATE public.site_content
SET
  data = jsonb_set(
    data,
    '{portfolio,videos}',
    (
      SELECT COALESCE(jsonb_agg(
        CASE
          WHEN (video->>'source') = 'file'
            AND (video->>'url') ~ '178476(5318172|7506464)-'
          THEN jsonb_set(video, '{url}', '""'::jsonb)
          ELSE video
        END
      ), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(data->'portfolio'->'videos', '[]'::jsonb)) AS video
    )
  ),
  updated_at = now()
WHERE id = 1;
