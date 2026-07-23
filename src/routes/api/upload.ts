import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminFromRequest } from "@/lib/admin-auth.server";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"] as const;

export const Route = createFileRoute("/api/upload")({
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

        let body: HandleUploadBody;
        try {
          body = (await request.json()) as HandleUploadBody;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        try {
          const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
              await requireAdminFromRequest(request);

              let kind: "image" | "video" = "image";
              try {
                const payload = clientPayload ? JSON.parse(clientPayload) : {};
                if (payload.kind === "video") kind = "video";
              } catch {
                // ignore bad payload — default to image
              }

              const allowedContentTypes = kind === "video" ? [...VIDEO_TYPES] : [...IMAGE_TYPES];
              const maximumSizeInBytes = kind === "video" ? 100 * 1024 * 1024 : 5 * 1024 * 1024;

              return {
                allowedContentTypes,
                maximumSizeInBytes,
                addRandomSuffix: true,
                tokenPayload: JSON.stringify({ pathname, kind }),
              };
            },
            onUploadCompleted: async () => {
              // Client already receives the blob URL; CMS save is separate.
            },
          });

          return Response.json(jsonResponse);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          const status = /unauthorized|forbidden/i.test(message) ? 401 : 400;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
