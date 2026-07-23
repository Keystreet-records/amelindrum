const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const R2_DEV_HOST_SUFFIX = ".r2.dev";

/** True for public Vercel Blob object URLs we manage. */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** True for Cloudflare R2 public development URLs (pub-*.r2.dev). */
export function isR2DevUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(R2_DEV_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Custom R2 domain from VITE_R2_PUBLIC_BASE_URL (optional client mirror of R2_PUBLIC_BASE_URL).
 */
export function isConfiguredR2PublicUrl(url: string): boolean {
  const base = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined)?.trim();
  if (!base) return false;
  try {
    const parsed = new URL(url);
    const configured = new URL(base);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === configured.hostname &&
      parsed.pathname.includes("/portfolio/")
    );
  } catch {
    return false;
  }
}

export function isR2PublicUrl(url: string): boolean {
  return isR2DevUrl(url) || isConfiguredR2PublicUrl(url);
}

/**
 * Only legacy Vercel Blob needs the same-origin proxy (large Ranges stall).
 * R2 plays/loads directly — proxying through Vercel makes video unusably slow.
 */
export function needsMediaProxy(url: string): boolean {
  return isVercelBlobUrl(url);
}

/** Same-origin proxy for legacy Blob media only. */
export function proxiedMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !needsMediaProxy(trimmed)) return trimmed;
  return `/api/media-proxy?u=${encodeURIComponent(trimmed)}`;
}
