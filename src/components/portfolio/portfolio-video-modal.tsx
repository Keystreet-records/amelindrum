import { useCallback, useEffect, useRef, useState } from "react";
import { animateVideoModal } from "@/hooks/use-landing-motion";
import { getPortfolioVideoEmbed, type PortfolioVideo } from "@/lib/site-content";

type PortfolioVideoModalProps = {
  video: PortfolioVideo | null;
  onClose: () => void;
};

export function PortfolioVideoModal({ video, onClose }: PortfolioVideoModalProps) {
  const [closing, setClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const embed = video && video.source !== "file" ? getPortfolioVideoEmbed(video) : null;
  const fileUrl = video?.source === "file" ? video.url.trim() : "";

  const close = useCallback(() => {
    if (!overlayRef.current || !panelRef.current || closing || !video) return;
    setClosing(true);
    animateVideoModal(overlayRef.current, panelRef.current, "out", () => {
      setClosing(false);
      onClose();
    });
  }, [closing, onClose, video]);

  useEffect(() => {
    if (!video) return;
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
  }, [video]);

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
          aria-label="Закрыть"
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
          {fileUrl ? (
            <video
              key={fileUrl}
              src={fileUrl}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          ) : embed ? (
            <iframe
              src={embed}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-lg font-medium text-foreground">{video.title}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {video.source === "file"
                  ? "Видеофайл ещё не загружен. Добавьте его в админ-панели."
                  : video.source === "vk"
                    ? "Ссылка на VK Embed не добавлена. Нужна ссылка вида https://vk.com/video_ext.php?oid=...&id=...&hash=..."
                    : "Ссылка на YouTube не добавлена. Добавьте её в админ-панели."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
