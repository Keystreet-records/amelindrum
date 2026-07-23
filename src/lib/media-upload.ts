import { supabase } from "@/integrations/supabase/client";
import { prepareVideoForUpload, VIDEO_MAX_BYTES, VIDEO_MAX_MB } from "@/lib/mp4-faststart";

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
  if (kind === "video" && (file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4"))) {
    return "mp4";
  }
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

/** Map R2/client errors to clear Russian messages for the admin UI. */
export function formatMediaUploadError(err: unknown, fallback = "Ошибка загрузки"): string {
  const message =
    err instanceof Error && err.message
      ? err.message
      : typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string"
        ? (err as { message: string }).message
        : fallback;

  if (/R2_|Cloudflare R2|не настроен|503/i.test(message)) {
    return "Хранилище Cloudflare R2 не настроено. Задайте R2_* переменные в Vercel / .env.";
  }
  if (/failed to retrieve|unauthorized|forbidden|войдите/i.test(message)) {
    return "Не удалось авторизовать загрузку. Обновите страницу и войдите в админку снова.";
  }
  if (/memory|array buffer|allocation|out of memory/i.test(message)) {
    return `Не хватило памяти в браузере. Закройте лишние вкладки и загрузите файл до ${VIDEO_MAX_MB} МБ.`;
  }
  if (/network|failed to fetch|timeout|aborted|cors/i.test(message)) {
    return "Сеть оборвалась или CORS на R2 не разрешает загрузку. Проверьте интернет и CORS bucket.";
  }
  if (/content.?type|not allowed|invalid.*type|формат/i.test(message)) {
    return "Формат файла не принят. Нужен MP4 (H.264), WebM или MOV.";
  }
  if (/maximumSize|too large|entity too large|413|больше лимита/i.test(message)) {
    return `Файл больше лимита ${VIDEO_MAX_MB} МБ. Сожмите видео и попробуйте снова.`;
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
};

type PresignResponse = {
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  cacheControl?: string;
  error?: string;
};

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (progress: MediaUploadProgress) => void,
  cacheControl?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    if (cacheControl) {
      xhr.setRequestHeader("Cache-Control", cacheControl);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const total = event.total || file.size || 1;
      const loaded = event.loaded;
      onProgress?.({
        phase: "uploading",
        loaded,
        total,
        percentage: Math.min(100, Math.round((loaded / total) * 100)),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`R2 отклонил загрузку (HTTP ${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Сеть оборвалась во время загрузки в R2"));
    xhr.onabort = () => reject(new Error("Загрузка прервана"));
    xhr.send(file);
  });
}

/**
 * Upload media to Cloudflare R2 via presigned PUT.
 * Videos are optimized for progressive streaming (faststart) before upload.
 */
export async function uploadSiteMedia(
  file: File,
  options: {
    kind: MediaKind;
    folder: string;
    onProgress?: (progress: MediaUploadProgress) => void;
  },
): Promise<MediaUploadResult> {
  if (options.kind === "video" && file.size > VIDEO_MAX_BYTES) {
    throw new Error(
      `Файл больше ${VIDEO_MAX_MB} МБ. Сожмите видео (HandBrake / экспорт H.264) и загрузите снова.`,
    );
  }

  options.onProgress?.({ phase: "preparing", loaded: 0, total: file.size || 1, percentage: 0 });

  const token = await getAccessToken();

  let uploadFile = file;
  let remuxed = false;

  if (options.kind === "video") {
    try {
      const prepared = await prepareVideoForUpload(file);
      uploadFile = prepared.file;
      remuxed = prepared.remuxed;
    } catch (err) {
      throw new Error(formatMediaUploadError(err, "Не удалось подготовить видео"));
    }
  }

  const total = uploadFile.size || 1;
  const ext = extensionFor(uploadFile, options.kind);
  const pathname = `${options.folder}/${Date.now()}.${ext}`;
  const contentType = contentTypeFor(uploadFile, options.kind);

  try {
    options.onProgress?.({ phase: "uploading", loaded: 0, total, percentage: 0 });

    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pathname,
        contentType,
        kind: options.kind,
        size: uploadFile.size,
      }),
    });

    let payload: PresignResponse = {};
    try {
      payload = (await presignRes.json()) as PresignResponse;
    } catch {
      /* ignore */
    }

    if (!presignRes.ok) {
      throw new Error(payload.error || `Не удалось получить URL загрузки (${presignRes.status})`);
    }
    if (!payload.uploadUrl || !payload.publicUrl) {
      throw new Error("Хранилище не вернуло URL файла");
    }

    await putFileWithProgress(
      payload.uploadUrl,
      uploadFile,
      contentType,
      options.onProgress,
      payload.cacheControl,
    );

    options.onProgress?.({ phase: "done", loaded: total, total, percentage: 100 });
    return {
      url: payload.publicUrl,
      remuxed,
      contentType,
      size: uploadFile.size,
    };
  } catch (err) {
    throw new Error(formatMediaUploadError(err));
  }
}

/** Delete a previously uploaded portfolio media file from Cloudflare R2. */
export async function deleteSiteMedia(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) return;

  const token = await getAccessToken();
  const res = await fetch("/api/media-delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: trimmed }),
  });

  if (!res.ok) {
    let message = "Не удалось удалить файл из хранилища";
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      /* ignore */
    }
    throw new Error(formatMediaUploadError(new Error(message), message));
  }
}

export { VIDEO_MAX_BYTES, VIDEO_MAX_MB };
