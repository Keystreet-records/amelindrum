import { useEffect, useRef, useState } from "react";
import { VIDEO_MAX_MB } from "@/lib/mp4-faststart";
import { needsMediaProxy, proxiedMediaUrl } from "@/lib/media-url";
import { polishLabel } from "@/lib/typography";
import { cn } from "@/lib/utils";

type FileVideoPlayerProps = {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
};

/** Simple <video> — Blob/R2 go through same-origin media-proxy (small Range chunks). */
export function FileVideoPlayer({
  src,
  title,
  className,
  autoPlay = true,
}: FileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const playSrc = needsMediaProxy(src) ? proxiedMediaUrl(src) : src.trim();

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playSrc) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    const onReady = () => {
      if (cancelled) return;
      setReady(true);
      if (autoPlay) void el.play().catch(() => undefined);
    };
    const onError = () => {
      if (cancelled) return;
      setError(
        polishLabel(
          `Не удалось проиграть видео. Нужен MP4 (H.264 + AAC) до ${VIDEO_MAX_MB} МБ.`,
        ),
      );
    };

    el.addEventListener("loadeddata", onReady);
    el.addEventListener("error", onError);
    el.src = playSrc;
    el.load();

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("error", onError);
      el.removeAttribute("src");
      el.load();
    };
  }, [playSrc, autoPlay, retryTick]);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        title={title}
        className="h-full w-full"
      />
      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
          <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => setRetryTick((n) => n + 1)}
          >
            {polishLabel("Повторить")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
