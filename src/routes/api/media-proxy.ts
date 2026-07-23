import { createFileRoute } from "@tanstack/react-router";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
/** Contiguous Blob GETs often stall; small Range parts complete reliably. */
const CHUNK_SIZE = 8 * 1024;
const CHUNK_RETRIES = 4;
/** Cap what we serve per request so serverless stays fast (browser asks for more). */
const MAX_CLIENT_RANGE_BYTES = 32 * 1024;
const BUFFER_UNDER_BYTES = 2 * 1024 * 1024;

function isImageContentType(contentType: string | null): boolean {
  return Boolean(contentType?.toLowerCase().startsWith("image/"));
}

/** Legacy Vercel Blob only — R2 must play/load directly (proxying is too slow). */
function isManagedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function copyUpstreamHeaders(
  partial: {
    contentType?: string | null;
    contentLength?: string | number | null;
    contentRange?: string | null;
    acceptRanges?: string | null;
    etag?: string | null;
    cacheControl?: string | null;
  },
  request: Request,
): Headers {
  const headers = new Headers();
  if (partial.contentType) headers.set("Content-Type", partial.contentType);
  if (partial.contentLength != null && partial.contentLength !== "") {
    headers.set("Content-Length", String(partial.contentLength));
  }
  if (partial.contentRange) headers.set("Content-Range", partial.contentRange);
  headers.set("Accept-Ranges", partial.acceptRanges || "bytes");
  if (partial.etag) headers.set("ETag", partial.etag);
  headers.set("Cache-Control", partial.cacheControl || "public, max-age=31536000, immutable");
  headers.set("Access-Control-Allow-Origin", "*");
  if (request.headers.get("range")) headers.set("Vary", "Range");
  return headers;
}

async function fetchBlobRange(url: string, start: number, end: number): Promise<Uint8Array> {
  const expected = end - start + 1;
  const out = new Uint8Array(expected);
  let filled = 0;
  let lastError: unknown;

  while (filled < expected) {
    let gotChunk = false;
    for (let attempt = 0; attempt < CHUNK_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6_000);
      try {
        const absStart = start + filled;
        const res = await fetch(url, {
          headers: { Range: `bytes=${absStart}-${end}` },
          redirect: "follow",
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
        await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    if (!gotChunk) {
      throw lastError instanceof Error ? lastError : new Error("Range fetch failed");
    }
  }

  return out;
}

async function fetchBlobBuffered(url: string, total: number): Promise<Uint8Array> {
  const partCount = Math.ceil(total / CHUNK_SIZE);
  const parts: Uint8Array[] = new Array(partCount);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(6, partCount) }, async () => {
    while (nextIndex < partCount) {
      const index = nextIndex;
      nextIndex += 1;
      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE - 1, total - 1);
      parts[index] = await fetchBlobRange(url, start, end);
    }
  });
  await Promise.all(workers);

  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

async function fetchBlobBufferedSlice(url: string, start: number, end: number): Promise<Uint8Array> {
  const length = end - start + 1;
  const out = new Uint8Array(length);
  let offset = 0;
  while (offset < length) {
    const absStart = start + offset;
    const absEnd = Math.min(absStart + CHUNK_SIZE - 1, end);
    const part = await fetchBlobRange(url, absStart, absEnd);
    if (!part.byteLength) throw new Error("Empty range part");
    out.set(part.subarray(0, Math.min(part.byteLength, length - offset)), offset);
    offset += part.byteLength;
  }
  return out;
}

async function proxyBlob(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get("u")?.trim() || "";
  if (!target || !isManagedMediaUrl(target)) {
    return Response.json({ error: "Invalid media URL" }, { status: 400 });
  }

  const clientRange = request.headers.get("range");

  if (clientRange) {
    const match = /bytes=(\d+)-(\d*)/.exec(clientRange);
    if (!match) {
      return Response.json({ error: "Invalid Range" }, { status: 400 });
    }

    const start = Number(match[1]);
    const endToken = match[2];
    const head = await fetch(target, { method: "HEAD", redirect: "follow" });
    if (!head.ok) {
      return Response.json(
        { error: `Upstream ${head.status}` },
        { status: head.status === 404 ? 404 : 502 },
      );
    }

    const total = Number(head.headers.get("content-length"));
    if (!Number.isFinite(total) || total <= 0) {
      return Response.json({ error: "Upstream missing Content-Length" }, { status: 502 });
    }

    const requestedEnd = endToken ? Number(endToken) : Math.min(start + MAX_CLIENT_RANGE_BYTES - 1, total - 1);
    if (!Number.isFinite(start) || !Number.isFinite(requestedEnd) || start < 0 || start >= total) {
      return Response.json({ error: "Invalid Range" }, { status: 416 });
    }

    // Never assemble multi-MB ranges in one invocation — CDN stalls and Vercel times out.
    const safeEnd = Math.min(requestedEnd, start + MAX_CLIENT_RANGE_BYTES - 1, total - 1);
    if (request.method === "HEAD") {
      const headers = copyUpstreamHeaders(
        {
          contentType: head.headers.get("content-type"),
          contentLength: safeEnd - start + 1,
          contentRange: `bytes ${start}-${safeEnd}/${total}`,
          etag: head.headers.get("etag"),
          cacheControl: head.headers.get("cache-control"),
        },
        request,
      );
      return new Response(null, { status: 206, headers });
    }

    const body = await fetchBlobBufferedSlice(target, start, safeEnd);
    const headers = copyUpstreamHeaders(
      {
        contentType: head.headers.get("content-type"),
        contentLength: body.byteLength,
        contentRange: `bytes ${start}-${start + body.byteLength - 1}/${total}`,
        etag: head.headers.get("etag"),
        cacheControl: head.headers.get("cache-control"),
      },
      request,
    );
    return new Response(body as BodyInit, { status: 206, headers });
  }

  const head = await fetch(target, { method: "HEAD", redirect: "follow" });
  if (!head.ok) {
    return Response.json(
      { error: `Upstream ${head.status}` },
      { status: head.status === 404 ? 404 : 502 },
    );
  }

  const contentType = head.headers.get("content-type");
  const total = Number(head.headers.get("content-length"));
  const headers = copyUpstreamHeaders(
    {
      contentType,
      contentLength: total,
      acceptRanges: head.headers.get("accept-ranges"),
      etag: head.headers.get("etag"),
      cacheControl: head.headers.get("cache-control"),
    },
    request,
  );

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const shouldBuffer =
    Number.isFinite(total) &&
    total > 0 &&
    total <= BUFFER_UNDER_BYTES &&
    (isImageContentType(contentType) || total <= 2 * 1024 * 1024);

  if (shouldBuffer) {
    const body = await fetchBlobBuffered(target, total);
    headers.set("Content-Length", String(body.byteLength));
    return new Response(body as BodyInit, { status: 200, headers });
  }

  // Large media: serve a small initial slice as 206 so <video> discovers size + Accept-Ranges.
  if (Number.isFinite(total) && total > 0) {
    const end = Math.min(MAX_CLIENT_RANGE_BYTES - 1, total - 1);
    const body = await fetchBlobBufferedSlice(target, 0, end);
    const partialHeaders = copyUpstreamHeaders(
      {
        contentType,
        contentLength: body.byteLength,
        contentRange: `bytes 0-${body.byteLength - 1}/${total}`,
        acceptRanges: "bytes",
        etag: head.headers.get("etag"),
        cacheControl: head.headers.get("cache-control"),
      },
      request,
    );
    return new Response(body as BodyInit, { status: 206, headers: partialHeaders });
  }

  return Response.json({ error: "Upstream missing Content-Length" }, { status: 502 });
}

export const Route = createFileRoute("/api/media-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => proxyBlob(request),
      HEAD: async ({ request }) => proxyBlob(request),
    },
  },
});
