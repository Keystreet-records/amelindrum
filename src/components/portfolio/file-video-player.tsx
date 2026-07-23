import { useEffect, useRef, useState } from "react";
import { polishLabel } from "@/lib/typography";
import { cn } from "@/lib/utils";

type FileVideoPlayerProps = {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
};

/**
 * Progressive MP4/WebM player: start as soon as metadata is ready,
 * keep buffering ahead while playing (hosting-style progressive download).
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
  const [bufferPct, setBufferPct] = useState(0);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;
    setReady(false);
    setError(null);
    setBufferPct(0);
    setWaiting(false);

    el.src = src;
    el.preload = "auto";

    const updateBuffer = () => {
      if (cancelled || !el.duration || !Number.isFinite(el.duration)) return;
      try {
        if (el.buffered.length > 0) {
          const end = el.buffered.end(el.buffered.length - 1);
          setBufferPct(Math.min(100, Math.round((end / el.duration) * 100)));
        }
      } catch {
        /* ignore */
      }
    };

    const onReady = () => {
      if (cancelled) return;
      setReady(true);
      setError(null);
      if (autoPlay) {
        const play = el.play();
        if (play && typeof play.catch === "function") play.catch(() => undefined);
      }
    };

    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onError = () => {
      if (cancelled) return;
      setError(
        polishLabel(
          "Не удалось проиграть видео. Нужен MP4 (H.264 + AAC) до 100 МБ, оптимимизированный для веба.",
        ),
      );
    };

    el.addEventListener("loadedmetadata", onReady);
    el.addEventListener("canplay", onReady);
    el.addEventListener("progress", updateBuffer);
    el.addEventListener("timeupdate", updateBuffer);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);

    try {
      el.load();
    } catch {
      /* ignore */
    }

    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) onReady();

    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", onReady);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("progress", updateBuffer);
      el.removeEventListener("timeupdate", updateBuffer);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
    };
  }, [src, autoPlay]);

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

      {ready && bufferPct < 100 ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-white/10" aria-hidden>
          <div
            className="h-full bg-primary/80 transition-[width] duration-300"
            style={{ width: `${bufferPct}%` }}
          />
        </div>
      ) : null}

      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 px-4 text-center">
          <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-foreground/90">{polishLabel("Старт…")}</p>
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
              onClick={() => {
                setError(null);
                setReady(false);
                const el = videoRef.current;
                if (!el) return;
                el.src = src;
                el.load();
              }}
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
