import { useEffect, useState } from "react";
import { isManagedRemoteImageUrl, loadRemoteImageObjectUrl } from "@/lib/remote-image";
import { cn } from "@/lib/utils";

type ReliableImageProps = {
  src: string;
  /** Shown immediately while remote (R2) loads; also used if remote fails. */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
  draggable?: boolean;
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Image that never goes blank for CMS/R2 media:
 * paints fallback first, then swaps to a fetched blob: URL after retries.
 */
export function ReliableImage({
  src,
  fallbackSrc = "",
  alt,
  className,
  width,
  height,
  loading = "eager",
  decoding = "async",
  draggable = false,
  fetchPriority,
}: ReliableImageProps) {
  const primary = src.trim();
  const fallback = fallbackSrc.trim();
  const remote = isManagedRemoteImageUrl(primary);

  const [displaySrc, setDisplaySrc] = useState(() => {
    if (remote) return fallback || primary;
    return primary || fallback;
  });

  useEffect(() => {
    const nextPrimary = src.trim();
    const nextFallback = fallbackSrc.trim();
    const isRemote = isManagedRemoteImageUrl(nextPrimary);

    if (!nextPrimary) {
      setDisplaySrc(nextFallback);
      return;
    }

    if (!isRemote) {
      setDisplaySrc(nextPrimary);
      return;
    }

    // Instant local paint, then upgrade.
    if (nextFallback) setDisplaySrc(nextFallback);

    const ac = new AbortController();
    void loadRemoteImageObjectUrl(nextPrimary, { signal: ac.signal })
      .then((url) => {
        if (!ac.signal.aborted) setDisplaySrc(url);
      })
      .catch(() => {
        if (!ac.signal.aborted && nextFallback) setDisplaySrc(nextFallback);
      });

    return () => ac.abort();
  }, [src, fallbackSrc]);

  if (!displaySrc) {
    return (
      <div
        className={cn("bg-muted/30", className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      draggable={draggable}
      fetchPriority={fetchPriority}
      className={className}
      onError={() => {
        if (fallback && displaySrc !== fallback) setDisplaySrc(fallback);
      }}
    />
  );
}
