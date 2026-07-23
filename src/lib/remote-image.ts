import { isR2PublicUrl } from "@/lib/media-url";

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 3;

/** Session cache: remote URL → object URL (or original URL if fetch unnecessary). */
const imageObjectUrlCache = new Map<string, string>();
const imageInflight = new Map<string, Promise<string>>();

export function isManagedRemoteImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return false;
  }
  return isR2PublicUrl(trimmed);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reliably load an R2 CMS image into a blob: URL.
 * Retries with timeout — avoids blank thumbs when r2.dev stalls mid-transfer.
 * Local paths are returned as-is.
 */
export async function loadRemoteImageObjectUrl(
  url: string,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
    retries?: number;
  },
): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("Пустой URL изображения");

  if (!isManagedRemoteImageUrl(trimmed)) {
    return trimmed;
  }

  const fetchUrl = trimmed;
  const cached = imageObjectUrlCache.get(fetchUrl);
  if (cached) return cached;

  const inflight = imageInflight.get(fetchUrl);
  if (inflight) return inflight;

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const outerSignal = options?.signal;

  const task = (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt < retries; attempt += 1) {
      if (outerSignal?.aborted) throw new DOMException("Aborted", "AbortError");

      const controller = new AbortController();
      const onAbort = () => controller.abort();
      outerSignal?.addEventListener("abort", onAbort, { once: true });
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(fetchUrl, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          // Retries bypass a bad/partial browser cache entry after a stall.
          cache: attempt === 0 ? "default" : "reload",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        if (!blob.size) throw new Error("Пустой ответ изображения");

        // Guard against HTML error pages served as 200.
        const type = (blob.type || res.headers.get("content-type") || "").toLowerCase();
        if (type && !type.startsWith("image/") && type !== "application/octet-stream") {
          throw new Error(`Неверный тип: ${type}`);
        }

        const objectUrl = URL.createObjectURL(blob);
        imageObjectUrlCache.set(fetchUrl, objectUrl);
        return objectUrl;
      } catch (err) {
        lastError = err;
        if (outerSignal?.aborted) throw err;
        await sleep(180 * (attempt + 1));
      } finally {
        window.clearTimeout(timer);
        outerSignal?.removeEventListener("abort", onAbort);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Не удалось загрузить изображение из хранилища");
  })();

  imageInflight.set(fetchUrl, task);
  try {
    return await task;
  } finally {
    imageInflight.delete(fetchUrl);
  }
}
