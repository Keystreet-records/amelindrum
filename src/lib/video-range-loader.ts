/**
 * Download a media file via small HTTP Range requests, then play from a blob: URL.
 * Works around CDNs that stall on large contiguous reads from byte 0.
 */

const CHUNK_SIZE = 64 * 1024;
const CONCURRENCY = 6;
const PART_RETRIES = 3;

export type RangeLoadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

async function fetchRange(
  url: string,
  start: number,
  end: number,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  let lastError: unknown;
  for (let attempt = 0; attempt < PART_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal,
        mode: "cors",
      });
      if (!(res.status === 206 || res.status === 200)) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.arrayBuffer();
    } catch (err) {
      lastError = err;
      if (signal?.aborted) throw err;
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Не удалось скачать фрагмент видео");
}

export async function loadMediaObjectUrl(
  url: string,
  options?: {
    contentType?: string;
    signal?: AbortSignal;
    onProgress?: (progress: RangeLoadProgress) => void;
  },
): Promise<string> {
  const signal = options?.signal;
  const head = await fetch(url, { method: "HEAD", signal, mode: "cors" });
  if (!head.ok) {
    throw new Error("Не удалось получить размер видео");
  }

  const total = Number(head.headers.get("content-length"));
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Сервер не вернул размер файла");
  }

  const partCount = Math.ceil(total / CHUNK_SIZE);
  const parts: ArrayBuffer[] = new Array(partCount);
  let loaded = 0;
  let nextIndex = 0;

  const report = () => {
    options?.onProgress?.({
      loaded,
      total,
      percentage: Math.min(100, Math.round((loaded / total) * 100)),
    });
  };

  const fetchPart = async (index: number) => {
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE - 1, total - 1);
    const buf = await fetchRange(url, start, end, signal);
    parts[index] = buf;
    loaded += buf.byteLength;
    report();
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, partCount) }, async () => {
    while (nextIndex < partCount) {
      const index = nextIndex;
      nextIndex += 1;
      await fetchPart(index);
    }
  });

  await Promise.all(workers);

  const type = options?.contentType || head.headers.get("content-type") || "video/mp4";
  const blob = new Blob(parts, { type });
  return URL.createObjectURL(blob);
}
