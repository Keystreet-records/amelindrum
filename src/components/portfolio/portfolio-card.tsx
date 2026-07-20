import type { PortfolioVideo } from "@/lib/site-content";
import { cn } from "@/lib/utils";

type PortfolioCardProps = {
  video: PortfolioVideo;
  thumbSrc: string;
  onOpen: () => void;
  className?: string;
  reveal?: boolean;
};

export function PortfolioCard({
  video,
  thumbSrc,
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
        reveal && "opacity-0",
        className,
      )}
    >
      <div className="portfolio-card__media relative aspect-video overflow-hidden rounded-t-2xl">
        <img
          src={thumbSrc}
          alt={video.title}
          loading="lazy"
          width={1280}
          height={720}
          className="portfolio-card__thumb h-full w-full object-cover"
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
