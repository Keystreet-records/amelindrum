import { useEffect, useRef, useState } from "react";
import { VIDEO_MAX_MB } from "@/lib/mp4-faststart";
import { isVercelBlobUrl, proxiedMediaUrl } from "@/lib/media-url";
import { polishLabel } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { loadMediaObjectUrl } from "@/lib/video-range-loader";

type FileVideoPlayerProps = {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
};

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && /abort/i.test(err.message)) return true;
  return false;
}

/**
 * R2 / CDN: play URL directly (browser Range + faststart).
 * Legacy Vercel Blob: assemble via same-origin proxy (Blob full GETs stall).
 */
export function FileVideoPlayer({
  src,
  title,
  className,
  autoPlay = true,
}: FileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [loadingPct, setLoadingPct] = useState<number | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    const ac = new AbortController();

    setReady(false);
    setError(null);
    setWaiting(false);
    setLoadingPct(null);

    const markReady = () => {
      if (cancelled) return;
      setReady(true);
      setError(null);
      setLoadingPct(null);
      if (autoPlay) void el.play().catch(() => undefined);
    };

    const fail = (message: string) => {
      if (cancelled) return;
      setError(polishLabel(message));
      setReady(false);
      setLoadingPct(null);
    };

    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onError = () => {
      if (cancelled) return;
      fail(
        `Не удалось проиграть видео. Нужен MP4 (H.264 + AAC) до ${VIDEO_MAX_MB} МБ, с moov в начале файла (faststart).`,
      );
    };

    const bindSrc = (url: string) => {
      if (cancelled) return;
      el.src = url;
      el.preload = "auto";
      try {
        el.load();
      } catch {
        /* ignore */
      }
      if (el.readyState >= HTMLMediaElement.HAVE_METADATA) markReady();
    };

    el.addEventListener("loadedmetadata", markReady);
    el.addEventListener("canplay", markReady);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);

    if (!isVercelBlobUrl(src)) {
      // R2 and everything else: progressive play, no Vercel hop.
      bindSrc(src.trim());
    } else {
      setLoadingPct(0);
      void loadMediaObjectUrl(proxiedMediaUrl(src), {
        signal: ac.signal,
        contentType: "video/mp4",
        onProgress: (p) => {
          if (!cancelled) setLoadingPct(p.percentage);
        },
      })
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          objectUrl = url;
          bindSrc(url);
        })
        .catch((err) => {
          if (cancelled || ac.signal.aborted || isAbortError(err)) return;
          fail(
            err instanceof Error && err.message
              ? err.message
              : `Не удалось загрузить видео (до ${VIDEO_MAX_MB} МБ). Проверьте сеть и формат MP4 H.264.`,
          );
        });
    }

    return () => {
      cancelled = true;
      ac.abort();
      el.removeEventListener("loadedmetadata", markReady);
      el.removeEventListener("canplay", markReady);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
      el.removeAttribute("src");
      try {
        el.load();
      } catch {
        /* ignore */
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, autoPlay, retryTick]);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        controls
        playsInline
        preload="auto"
        title={title}
        className="h-full w-full"
      />

      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 px-4 text-center">
          <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-foreground/90">
            {loadingPct !== null
              ? polishLabel(`Загрузка ${loadingPct}%…`)
              : polishLabel("Старт…")}
          </p>
        </div>
      ) : null}

      {waiting && ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => setRetryTick((n) => n + 1)}
            >
              {polishLabel("Повторить")}
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {polishLabel("Открыть файл")}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
