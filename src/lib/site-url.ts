/**
 * Canonical public site origin for OG tags, embeds, absolute asset URLs.
 * Never ship localhost into production meta — CLI deploys can bake local .env.
 */
export function getPublicSiteUrl(): string {
  const vercelHost = readVercelHost();
  if (vercelHost) return `https://${vercelHost}`;

  const configured = normalizeOrigin(import.meta.env.VITE_SITE_URL);
  const localConfigured = isLocalHost(configured);

  if (typeof window !== "undefined") {
    if (!configured || localConfigured) return window.location.origin;
    return configured;
  }

  if (configured && !localConfigured) return configured;
  if (import.meta.env.PROD) return "https://amelindrum.vercel.app";
  return configured || "http://localhost:8080";
}

function readVercelHost(): string {
  if (typeof process === "undefined") return "";
  const raw =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeOrigin(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/$/, "");
}

function isLocalHost(origin: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(origin);
}
