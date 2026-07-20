# Amelindrum — сайт Аркадия Амелина

Лендинг сессионного барабанщика. Стек заточен под простой прод:

| Слой | Сервис | Зачем |
|------|--------|--------|
| Хостинг + CI | **GitHub → Vercel** | Деплой, превью, env |
| Тексты + вход в `/admin` | **Supabase** | `site_content`, Auth, роль `admin` |
| Фото и видео из админки | **Vercel Blob** | Загрузка файлов без сторонних CDN |
| UI | TanStack Start + React 19 + Tailwind 4 | SSR-лендинг |

```
Браузер ──► Vercel (сайт)
               │
               ├─► Supabase  (тексты, логин админа)
               └─► Vercel Blob (медиа из /admin)
```

## Структура

| Путь | Назначение |
|------|------------|
| `src/routes/index.tsx` | Публичный лендинг |
| `src/routes/admin.tsx` | CMS: тексты + загрузка медиа |
| `src/routes/api/upload.ts` | Токены Vercel Blob (только admin) |
| `src/lib/site-content.ts` | Типы и дефолтный контент |
| `public/media/` | Дефолтные фото (без Blob) |
| `supabase/migrations/` | Auth + `site_content` + RLS |

## Локальный запуск

**Требования:** Node.js 22+ или [Bun](https://bun.sh).

```bash
cp .env.example .env
# Supabase URL/keys + (для загрузки медиа) BLOB_READ_WRITE_TOKEN

bun install
bun run dev   # http://localhost:8080
```

```bash
bun run lint && bun run typecheck && bun run build
```

## Переменные окружения

| Переменная | Где |
|------------|-----|
| `VITE_SUPABASE_URL` | Браузер |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Браузер |
| `SUPABASE_URL` | SSR / server functions |
| `SUPABASE_PUBLISHABLE_KEY` | SSR / auth |
| `BLOB_READ_WRITE_TOKEN` | Загрузка медиа (Vercel Blob) |
| `VITE_SITE_URL` | OG / абсолютные ссылки (на проде — ваш домен) |

`.env` не коммитить. На Vercel те же ключи в Project → Settings → Environment Variables.

## Деплой (практичный путь)

1. Создайте репозиторий на **GitHub**, запушьте код.
2. [Vercel](https://vercel.com) → Import project из GitHub.
3. Добавьте env из таблицы выше.
4. Vercel → **Storage → Blob → Create** — появится `BLOB_READ_WRITE_TOKEN`.
5. В **Supabase** уже должны быть таблица `site_content` и пользователь с ролью `admin` (см. `docs/SECURITY.md`).
6. Deploy → сайт на `*.vercel.app`, админка `/admin`.

Локальная загрузка медиа: `vercel env pull .env.local` или вручную вставить Blob-токен в `.env`.

## Безопасность

См. [docs/SECURITY.md](docs/SECURITY.md) — смените пароль админа из сидов Lovable.
