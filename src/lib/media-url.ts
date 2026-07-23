const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** True for public Vercel Blob object URLs we manage. */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Same-origin proxy for legacy Vercel Blob media only.
 * Cloudflare R2 / custom CDN URLs are used as-is (browser Range works).
 */
export function proxiedMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !isVercelBlobUrl(trimmed)) return trimmed;
  return `/api/media-proxy?u=${encodeURIComponent(trimmed)}`;
}
