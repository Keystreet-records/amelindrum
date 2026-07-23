import type { PortfolioVideo } from "@/lib/site-content";
import { proxiedMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type PortfolioCardProps = {
  video: PortfolioVideo;
  thumbSrc: string;
  /** Used when the custom/remote cover fails to decode. */
  fallbackSrc?: string;
  onOpen: () => void;
  className?: string;
  reveal?: boolean;
};

export function PortfolioCard({
  video,
  thumbSrc,
  fallbackSrc,
  onOpen,
  className,
  reveal = true,
}: PortfolioCardProps) {
  return (
    <button
      type="button"
      data-reveal={reveal ? "card" : undefined}
      onClick={onOpen}
      className={cn(
        "portfolio-card group relative flex h-full w-full cursor-pointer flex-col rounded-2xl border border-border bg-card text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        className,
      )}
    >
      <div className="portfolio-card__media relative aspect-video overflow-hidden rounded-t-2xl bg-muted/30">
        <PortfolioCoverImage
          key={thumbSrc}
          primary={thumbSrc}
          fallback={fallbackSrc || ""}
          alt={video.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="portfolio-card__play flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_oklch(0.60_0.20_145_/_0.55)] md:size-14">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5 size-5 md:size-6"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-snug md:text-2xl">{video.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{video.desc}</p>
        {video.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/80 bg-secondary/25 px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function resolveCoverSrc(url: string): string {
  return proxiedMediaUrl(url);
}

function PortfolioCoverImage({
  primary,
  fallback,
  alt,
}: {
  primary: string;
  fallback: string;
  alt: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState(() => resolveCoverSrc(primary));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSrc(resolveCoverSrc(primary));
    setReady(false);
  }, [primary]);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setReady(true);
  }, [src]);

  // R2 sometimes stalls mid-transfer; don't leave a blank card forever.
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => {
      const next = fallback ? resolveCoverSrc(fallback) : "";
      if (next && src !== next) setSrc(next);
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [src, ready, fallback]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      /* Lazy: R2 covers can stall; eager images block window `load` → endless tab spinner */
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      width={1280}
      height={720}
      className={cn(
        "portfolio-card__thumb absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0",
      )}
      onLoad={() => setReady(true)}
      onError={() => {
        setReady(false);
        const next = fallback ? resolveCoverSrc(fallback) : "";
        if (next && src !== next) setSrc(next);
      }}
    />
  );
}
