/**
 * Download a media file via small HTTP Range requests, then play from a blob: URL.
 * Works around CDNs that stall on large contiguous reads from byte 0.
 */

/** Proxy Range parts stay small; truncated Blob responses are resumed. */
const CHUNK_SIZE = 8 * 1024;
const CONCURRENCY = 2;
const PART_RETRIES = 6;
const PART_TIMEOUT_MS = 8_000;

export type RangeLoadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

async function fetchRangeExact(
  url: string,
  start: number,
  end: number,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const expected = end - start + 1;
  const out = new Uint8Array(expected);
  let filled = 0;
  let lastError: unknown;

  while (filled < expected) {
    let gotChunk = false;

    for (let attempt = 0; attempt < PART_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });
      const timer = window.setTimeout(() => controller.abort(), PART_TIMEOUT_MS);

      try {
        const absStart = start + filled;
        const res = await fetch(url, {
          headers: { Range: `bytes=${absStart}-${end}` },
          signal: controller.signal,
        });
        if (!(res.status === 206 || res.status === 200)) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buf = new Uint8Array(await res.arrayBuffer());
        if (!buf.byteLength) throw new Error("Empty range body");
        const copy = Math.min(buf.byteLength, expected - filled);
        out.set(buf.subarray(0, copy), filled);
        filled += copy;
        gotChunk = true;
        break;
      } catch (err) {
        lastError = err;
        if (signal?.aborted) throw err;
        await new Promise((r) => setTimeout(r, 160 * (attempt + 1)));
      } finally {
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    }

    if (!gotChunk) {
      throw lastError instanceof Error ? lastError : new Error("Не удалось скачать фрагмент медиа");
    }
  }

  return out.buffer;
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
  const head = await fetch(url, { method: "HEAD", signal });
  if (!head.ok) {
    throw new Error("Не удалось получить размер файла");
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
    const buf = await fetchRangeExact(url, start, end, signal);
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

  const assembled = parts.reduce((sum, part) => sum + part.byteLength, 0);
  if (assembled !== total) {
    throw new Error(`Сборка файла неполная (${assembled}/${total})`);
  }

  const type = options?.contentType || head.headers.get("content-type") || "application/octet-stream";
  return URL.createObjectURL(new Blob(parts, { type }));
}
