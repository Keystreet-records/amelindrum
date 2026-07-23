import { createFileRoute } from "@tanstack/react-router";
import { del } from "@vercel/blob";
import { requireAdminFromRequest } from "@/lib/admin-auth.server";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function isManagedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      parsed.pathname.includes("/portfolio/")
    );
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/media-delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return Response.json(
            {
              error:
                "BLOB_READ_WRITE_TOKEN не задан. Создайте Blob Store в Vercel и добавьте токен в env.",
            },
            { status: 503 },
          );
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
        if (!isManagedBlobUrl(url)) {
          return Response.json(
            { error: "Можно удалять только файлы из нашего Vercel Blob (portfolio)." },
            { status: 400 },
          );
        }

        try {
          await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
          return Response.json({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Delete failed";
          // Already gone — treat as success so admin can still clear CMS.
          if (/not found|404|does not exist/i.test(message)) {
            return Response.json({ ok: true, missing: true });
          }
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
