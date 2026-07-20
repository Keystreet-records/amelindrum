# Supabase

Используется только для:

- Auth (логин `/admin`)
- Таблица `site_content` + `user_roles` + RLS
- Realtime на `site_content` (обновление лендинга после сохранения)

**Медиа не здесь.** Фото/видео → Vercel Blob (`src/routes/api/upload.ts`).

## Миграции

Нужны для CMS: `site_content`, роли, realtime.

Устаревшие (можно не применять на новых проектах):

- `*site_media_storage*` — бакет Supabase Storage, заменён на Vercel Blob
- кусок `*fix_socials_and_ensure_media*` про `storage.buckets` — то же; блок с правкой socials в JSON ещё полезен
