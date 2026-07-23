# Amelindrum — сайт Аркадия Амелина

Лендинг сессионного барабанщика. Стек заточен под простой прод:

| Слой | Сервис | Зачем |
|------|--------|--------|
| Хостинг + CI | **GitHub → Vercel** | Деплой, превью, env |
| Тексты + вход в `/admin` | **Supabase** | `site_content`, Auth, роль `admin` |
| Фото, обложки, видео | **Cloudflare R2** | Presigned PUT + публичный CDN URL |
| UI | TanStack Start + React 19 + Tailwind 4 | SSR-лендинг |

```
Admin ──► /api/upload (presign) ──► PUT → Cloudflare R2
CMS   ──► публичный https://media.… URL
Сайт  ──► <video> / <img> напрямую (Range в браузере)
```

## Структура

| Путь | Назначение |
|------|------------|
| `src/routes/index.tsx` | Публичный лендинг |
| `src/routes/admin.tsx` | CMS: тексты + загрузка медиа |
| `src/routes/api/upload.ts` | Presigned PUT для R2 (только admin) |
| `src/routes/api/media-delete.ts` | Удаление объектов R2 (только admin) |
| `src/lib/r2.server.ts` | S3-совместимый клиент R2 |
| `src/lib/site-content.ts` | Типы и дефолтный контент |
| `public/media/` | Дефолтные фото (без R2) |
| `supabase/migrations/` | Auth + `site_content` + RLS |

## Локальный запуск

**Требования:** Node.js 22+ или [Bun](https://bun.sh).

```bash
cp .env.example .env
# Supabase URL/keys + R2_* для загрузки медиа

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
| `R2_ACCOUNT_ID` | Presign / delete |
| `R2_ACCESS_KEY_ID` | Presign / delete |
| `R2_SECRET_ACCESS_KEY` | Presign / delete |
| `R2_BUCKET_NAME` | Presign / delete |
| `R2_PUBLIC_BASE_URL` | Публичные URL в CMS (без `/` в конце) |
| `VITE_SITE_URL` | OG / абсолютные ссылки (на проде — ваш домен) |

`.env` не коммитить. На Vercel те же ключи в Project → Settings → Environment Variables.

## Cloudflare R2 (медиа)

1. Cloudflare → **R2** → Create bucket (например `amelindrum-media`).
2. **Manage R2 API Tokens** → Create API token with Object Read & Write на этот bucket.
3. Публичный доступ: подключите **Custom Domain** (лучше) или включите **r2.dev** public URL.
4. **Settings → CORS** для bucket (иначе браузерный PUT из админки падает):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:8080",
      "https://amelindrum.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  ]
]
```

Добавьте свой прод-домен в `AllowedOrigins`.

5. В Vercel / `.env` задайте:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=amelindrum-media
R2_PUBLIC_BASE_URL=https://media.yourdomain.com
```

Старые URL `*.public.blob.vercel-storage.com` ещё читаются через `/api/media-proxy`; новые загрузки идут только в R2. Перезалейте медиа в админке, чтобы уйти с Blob.

## Деплой (практичный путь)

1. Создайте репозиторий на **GitHub**, запушьте код.
2. [Vercel](https://vercel.com) → Import project из GitHub.
3. Добавьте env из таблицы выше (включая R2_*).
4. В **Supabase** уже должны быть таблица `site_content` и пользователь с ролью `admin` (см. `docs/SECURITY.md`).
5. Deploy → сайт на `*.vercel.app`, админка `/admin`.

## Безопасность

См. [docs/SECURITY.md](docs/SECURITY.md) — смените пароль админа из сидов Lovable.
