const R2_DEV_HOST_SUFFIX = ".r2.dev";

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
 * Custom R2 domain from optional VITE_R2_PUBLIC_BASE_URL (client mirror of R2_PUBLIC_BASE_URL).
 * Not required for playback — R2 URLs load directly. Used only for client-side host checks.
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
