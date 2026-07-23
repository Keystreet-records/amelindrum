import { createFileRoute } from "@tanstack/react-router";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function isManagedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function buildProxyHeaders(upstream: Headers, request: Request): Headers {
  const headers = new Headers();
  const contentType = upstream.get("content-type");
  const contentLength = upstream.get("content-length");
  const contentRange = upstream.get("content-range");
  const acceptRanges = upstream.get("accept-ranges");
  const etag = upstream.get("etag");
  const cacheControl = upstream.get("cache-control");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", acceptRanges || "bytes");
  if (etag) headers.set("ETag", etag);
  headers.set("Cache-Control", cacheControl || "public, max-age=31536000, immutable");
  headers.set("Access-Control-Allow-Origin", "*");

  // Help caches distinguish ranged responses.
  const range = request.headers.get("range");
  if (range) headers.set("Vary", "Range");

  return headers;
}

async function proxyBlob(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get("u")?.trim() || "";
  if (!target || !isManagedBlobUrl(target)) {
    return Response.json({ error: "Invalid media URL" }, { status: 400 });
  }

  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");
  if (range) upstreamHeaders.set("Range", range);

  const upstream = await fetch(target, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: upstreamHeaders,
    // Keep redirect behavior explicit.
    redirect: "follow",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return Response.json(
      { error: `Upstream ${upstream.status}` },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const headers = buildProxyHeaders(upstream.headers, request);

  if (request.method === "HEAD") {
    return new Response(null, { status: upstream.status, headers });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export const Route = createFileRoute("/api/media-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => proxyBlob(request),
      HEAD: async ({ request }) => proxyBlob(request),
    },
  },
});
