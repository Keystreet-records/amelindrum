import { createFileRoute } from "@tanstack/react-router";
import { requireAdminFromRequest } from "@/lib/admin-auth.server";
import {
  deleteR2ObjectByPublicUrl,
  getR2Config,
  r2MissingEnvMessage,
} from "@/lib/r2.server";

export const Route = createFileRoute("/api/media-delete")({
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

        let body: { url?: unknown };
        try {
          body = (await request.json()) as { url?: unknown };
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const url = typeof body.url === "string" ? body.url.trim() : "";
        if (!url) {
          return Response.json({ error: "Нужен URL файла" }, { status: 400 });
        }

        try {
          const result = await deleteR2ObjectByPublicUrl(url);
          if (result === "not_managed") {
            return Response.json(
              { error: "Можно удалять только файлы из нашего Cloudflare R2 (portfolio)." },
              { status: 400 },
            );
          }
          return Response.json({ ok: true, missing: result === "missing" });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Delete failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
