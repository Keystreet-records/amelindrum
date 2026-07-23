import { useCallback, useEffect, useRef, useState } from "react";
import { animateVideoModal } from "@/hooks/use-landing-motion";
import {
  getPortfolioVideoEmbed,
  getYoutubeWatchUrl,
  type PortfolioVideo,
} from "@/lib/site-content";
import { polishLabel } from "@/lib/typography";

type PortfolioVideoModalProps = {
  video: PortfolioVideo | null;
  onClose: () => void;
};

type FilePlayerState = "loading" | "ready" | "error";

function mimeForFileUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".webm")) return "video/webm";
  if (lower.includes(".mov") || lower.includes(".qt")) return "video/quicktime";
  return "video/mp4";
}

export function PortfolioVideoModal({ video, onClose }: PortfolioVideoModalProps) {
  const [closing, setClosing] = useState(false);
  /** Delay iframe/video mount until after open — keeps the click as a real user gesture. */
  const [playerReady, setPlayerReady] = useState(false);
  const [fileState, setFileState] = useState<FilePlayerState>("loading");
  const [fileError, setFileError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const embed = video && video.source !== "file" ? getPortfolioVideoEmbed(video) : null;
  const fileUrl = video?.source === "file" ? video.url.trim() : "";
  const youtubeWatch = video?.source === "youtube" ? getYoutubeWatchUrl(video.url) : null;

  const close = useCallback(() => {
    if (!overlayRef.current || !panelRef.current || closing || !video) return;
    setClosing(true);
    animateVideoModal(overlayRef.current, panelRef.current, "out", () => {
      setClosing(false);
      onClose();
    });
  }, [closing, onClose, video]);

  useEffect(() => {
    if (!video) {
      setPlayerReady(false);
      setFileState("loading");
      setFileError(null);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [video, close]);

  useEffect(() => {
    if (!video || !overlayRef.current || !panelRef.current) return;
    animateVideoModal(overlayRef.current, panelRef.current, "in");
    setFileState("loading");
    setFileError(null);
    const id = window.requestAnimationFrame(() => setPlayerReady(true));
    return () => {
      window.cancelAnimationFrame(id);
      setPlayerReady(false);
    };
  }, [video]);

  useEffect(() => {
    if (!fileUrl || !playerReady) return;
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;
    const failTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setFileState("error");
        setFileError(
          polishLabel(
            "Видео не удалось загрузить за разумное время. Проверьте связь или перезалейте файл (H.264 MP4).",
          ),
        );
      }
    }, 25000);

    const onReady = () => {
      if (cancelled) return;
      setFileState("ready");
      setFileError(null);
      window.clearTimeout(failTimer);
      const play = el.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {
          /* autoplay may be blocked — controls remain */
        });
      }
    };

    const onError = () => {
      if (cancelled) return;
      window.clearTimeout(failTimer);
      setFileState("error");
      setFileError(
        polishLabel(
          "Браузер не смог проиграть файл. Нужен MP4 (H.264 + AAC), лучше до 100 МБ. Перезалейте через админку.",
        ),
      );
    };

    el.addEventListener("loadeddata", onReady);
    el.addEventListener("canplay", onReady);
    el.addEventListener("error", onError);

    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onError);
    };
  }, [fileUrl, playerReady]);

  if (!video) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-4xl cursor-default overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors duration-300 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label={polishLabel("Закрыть")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5"
            aria-hidden
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <div className="relative aspect-video bg-black">
          {fileUrl && playerReady ? (
            <>
              <video
                ref={videoRef}
                key={fileUrl}
                controls
                playsInline
                preload="auto"
                className="h-full w-full"
              >
                <source src={fileUrl} type={mimeForFileUrl(fileUrl)} />
              </video>
              {fileState === "loading" ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-foreground/90">
                    {polishLabel("Загрузка видео…")}
                  </p>
                </div>
              ) : null}
              {fileState === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
                  <p className="text-lg font-medium text-foreground">{video.title}</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {fileError ?? polishLabel("Не удалось проиграть видео.")}
                  </p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {polishLabel("Открыть файл напрямую")}
                  </a>
                </div>
              ) : null}
            </>
          ) : embed && playerReady ? (
            <iframe
              src={embed}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="eager"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-lg font-medium text-foreground">{video.title}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {video.source === "file"
                  ? polishLabel("Видеофайл ещё не загружен. Добавьте его в админ-панели.")
                  : video.source === "vk"
                    ? polishLabel(
                        "Ссылка на VK Embed не добавлена. Нужна ссылка вида https://vk.com/video_ext.php?oid=...&id=...&hash=...",
                      )
                    : polishLabel("Ссылка на YouTube не добавлена. Добавьте её в админ-панели.")}
              </p>
            </div>
          )}
        </div>
        {youtubeWatch ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {polishLabel(
                "Если YouTube просит войти — откройте ролик на YouTube или загрузите файл в админке.",
              )}
            </p>
            <a
              href={youtubeWatch}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {polishLabel("Смотреть на YouTube")}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
