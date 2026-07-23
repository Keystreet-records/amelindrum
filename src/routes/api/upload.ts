import { createFileRoute } from "@tanstack/react-router";
import { requireAdminFromRequest } from "@/lib/admin-auth.server";
import { VIDEO_MAX_BYTES } from "@/lib/mp4-faststart";
import { createPresignedPutUrl, getR2Config, r2MissingEnvMessage } from "@/lib/r2.server";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);

type PresignBody = {
  pathname?: unknown;
  contentType?: unknown;
  kind?: unknown;
  size?: unknown;
};

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!getR2Config()) {
          return Response.json({ error: r2MissingEnvMessage() }, { status: 503 });
        }

        try {
          await requireAdminFromRequest(request);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unauthorized";
          const status = /forbidden/i.test(message) ? 403 : 401;
          return Response.json({ error: message }, { status });
        }

        let body: PresignBody;
        try {
          body = (await request.json()) as PresignBody;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "";
        const contentType =
          typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "";
        const kind = body.kind === "video" ? "video" : "image";
        const size = typeof body.size === "number" && Number.isFinite(body.size) ? body.size : 0;

        if (!pathname || !contentType) {
          return Response.json({ error: "Нужны pathname и contentType" }, { status: 400 });
        }

        const allowed = kind === "video" ? VIDEO_TYPES : IMAGE_TYPES;
        if (!allowed.has(contentType)) {
          return Response.json(
            {
              error:
                kind === "video"
                  ? "Формат видео не принят. Нужен MP4, WebM или MOV."
                  : "Формат изображения не принят. Нужен JPEG, PNG или WebP.",
            },
            { status: 400 },
          );
        }

        const maxBytes = kind === "video" ? VIDEO_MAX_BYTES : 5 * 1024 * 1024;
        if (!(size > 0) || size > maxBytes) {
          return Response.json(
            {
              error:
                kind === "video"
                  ? size > maxBytes
                    ? `Файл больше лимита ${Math.floor(VIDEO_MAX_BYTES / (1024 * 1024))} МБ.`
                    : "Нужен размер файла (size)."
                  : size > maxBytes
                    ? "Изображение больше 5 МБ."
                    : "Нужен размер файла (size).",
            },
            { status: 400 },
          );
        }

        try {
          const suffix = crypto.randomUUID().slice(0, 8);
          const stamped = pathname.replace(/(\.[a-z0-9]+)$/i, `-${suffix}$1`);
          const result = await createPresignedPutUrl({
            key: stamped,
            contentType,
          });
          return Response.json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
