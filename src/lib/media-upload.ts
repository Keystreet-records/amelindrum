import { upload } from "@vercel/blob/client";
import { supabase } from "@/integrations/supabase/client";

export type MediaKind = "image" | "video";

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Войдите в админку, чтобы загружать файлы");
  return token;
}

function extensionFor(file: File, kind: MediaKind): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (kind === "video") {
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    return "mp4";
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Upload media via Vercel Blob (client → Blob CDN).
 * Requires BLOB_READ_WRITE_TOKEN on the server and admin session in the browser.
 */
export async function uploadSiteMedia(
  file: File,
  options: { kind: MediaKind; folder: string },
): Promise<string> {
  const token = await getAccessToken();
  const ext = extensionFor(file, options.kind);
  const pathname = `${options.folder}/${Date.now()}.${ext}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    multipart: options.kind === "video" || file.size > 8 * 1024 * 1024,
    contentType: file.type || undefined,
    clientPayload: JSON.stringify({ kind: options.kind }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return blob.url;
}
