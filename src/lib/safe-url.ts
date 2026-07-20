const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Returns a safe href or null for disallowed schemes (e.g. javascript:). */
export function sanitizeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return null;

  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return trimmed;
  }

  // Same-origin public assets (deployed from /public/media)
  if (trimmed.startsWith("/media/")) {
    return trimmed;
  }

  // Bare social handle — not a navigable URL
  if (trimmed.startsWith("@")) return null;

  // Domain without protocol → https
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && /^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(trimmed)) {
    return sanitizeHref(`https://${trimmed}`);
  }

  try {
    const parsed = new URL(trimmed, "https://placeholder.invalid");
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      // Relative / incomplete input resolved against the placeholder base
      if (parsed.hostname === "placeholder.invalid") return null;
      return parsed.href;
    }
    return trimmed;
  } catch {
    return null;
  }
}

export const safeUrlSchema = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") return value;
  // Allow same-origin public media paths used by CMS defaults
  if (trimmed.startsWith("/media/")) return value;
  const href = sanitizeHref(value);
  if (href === null) {
    throw new Error("Разрешены только ссылки http(s), mailto:, tel: и пути /media/…");
  }
  return value;
};
