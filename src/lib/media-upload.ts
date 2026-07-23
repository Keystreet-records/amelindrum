import { upload } from "@vercel/blob/client";
import { supabase } from "@/integrations/supabase/client";
import { prepareVideoForUpload } from "@/lib/mp4-faststart";

export type MediaKind = "image" | "video";

const VIDEO_EXT = new Set(["mp4", "m4v", "webm", "mov"]);

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Войдите в админку, чтобы загружать файлы");
  return token;
}

function extensionFor(file: File, kind: MediaKind): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (kind === "video" && file.type === "video/mp4") return "mp4";
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    if (kind === "video" && VIDEO_EXT.has(fromName)) return fromName === "m4v" ? "mp4" : fromName;
    if (kind === "image") return fromName;
  }
  if (kind === "video") {
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    return "mp4";
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function contentTypeFor(file: File, kind: MediaKind): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  if (kind === "video") {
    const ext = extensionFor(file, kind);
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    return "video/mp4";
  }
  const ext = extensionFor(file, kind);
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Map Blob/client errors to clear Russian messages for the admin UI. */
export function formatMediaUploadError(err: unknown, fallback = "Ошибка загрузки"): string {
  const message =
    err instanceof Error && err.message
      ? err.message
      : typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string"
        ? ((err as { message: string }).message)
        : fallback;

  if (/BLOB_READ_WRITE_TOKEN|не задан|503/i.test(message)) {
    return "Хранилище Vercel Blob не настроено. В Vercel создайте Blob Store — токен BLOB_READ_WRITE_TOKEN подтянется сам.";
  }
  if (/failed to retrieve the client token|unauthorized|forbidden|войдите/i.test(message)) {
    return "Не удалось авторизовать загрузку. Обновите страницу и войдите в админку снова.";
  }
  if (/memory|array buffer|allocation|out of memory/i.test(message)) {
    return "Не хватило памяти в браузере. Закройте лишние вкладки и попробуйте снова (до 200 МБ).";
  }
  if (/network|failed to fetch|timeout|aborted/i.test(message)) {
    return "Сеть оборвалась во время загрузки. Проверьте интернет и повторите — для больших файлов это нормально, просто дождитесь конца.";
  }
  if (/content.?type|not allowed|invalid.*type/i.test(message)) {
    return "Формат файла не принят хранилищем. Нужен MP4, WebM или MOV.";
  }
  if (/maximumSize|too large|entity too large|413/i.test(message)) {
    return "Файл больше лимита 200 МБ. Сожмите видео и попробуйте снова.";
  }
  return message || fallback;
}

export type MediaUploadProgress = {
  phase: "preparing" | "uploading" | "done";
  loaded: number;
  total: number;
  percentage: number;
};

export type MediaUploadResult = {
  url: string;
  remuxed: boolean;
  contentType: string;
  size: number;
  warning?: string;
};

/**
 * Upload media via Vercel Blob (client → Blob CDN).
 * Videos are remuxed to MP4 faststart when needed (memory-safe up to 200MB).
 * Remux failure never blocks the upload.
 */
export async function uploadSiteMedia(
  file: File,
  options: {
    kind: MediaKind;
    folder: string;
    onProgress?: (progress: MediaUploadProgress) => void;
  },
): Promise<MediaUploadResult> {
  options.onProgress?.({ phase: "preparing", loaded: 0, total: file.size || 1, percentage: 0 });

  const token = await getAccessToken();

  let uploadFile = file;
  let remuxed = false;
  let warning: string | undefined;

  if (options.kind === "video") {
    const prepared = await prepareVideoForUpload(file);
    uploadFile = prepared.file;
    remuxed = prepared.remuxed;
    warning = prepared.warning;
  }

  const total = uploadFile.size || 1;
  const ext = extensionFor(uploadFile, options.kind);
  const pathname = `${options.folder}/${Date.now()}.${ext}`;
  const contentType = contentTypeFor(uploadFile, options.kind);

  try {
    options.onProgress?.({ phase: "uploading", loaded: 0, total, percentage: 0 });
    const blob = await upload(pathname, uploadFile, {
      access: "public",
      handleUploadUrl: "/api/upload",
      // Always multipart for video — required reliability for large files
      multipart: options.kind === "video" || uploadFile.size > 4 * 1024 * 1024,
      contentType,
      clientPayload: JSON.stringify({ kind: options.kind }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: ({ loaded, total: progressTotal, percentage }) => {
        options.onProgress?.({
          phase: "uploading",
          loaded,
          total: progressTotal || total,
          percentage,
        });
      },
    });

    if (!blob?.url) {
      throw new Error("Хранилище не вернуло URL файла");
    }

    options.onProgress?.({ phase: "done", loaded: total, total, percentage: 100 });
    return {
      url: blob.url,
      remuxed,
      contentType,
      size: uploadFile.size,
      warning,
    };
  } catch (err) {
    throw new Error(formatMediaUploadError(err));
  }
}
