import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CONTENT,
  getYoutubeThumbnail,
  normalizeSiteContent,
  resolvePortfolioCover,
  type PortfolioVideo,
  type SiteContent,
} from "@/lib/site-content";
import { getAdminSiteContent, saveAdminSiteContent } from "@/lib/site-content.functions";
import {
  Field,
  FileMeta,
  fileNameFromUrl,
  ItemCard,
  MediaPanel,
  Section,
  SegmentedControl,
  StatusMessage,
  Subsection,
  TextArea,
  adminControlClass,
} from "@/components/admin/admin-form";
import {
  UploadTimelineLoader,
  type UploadTimelineState,
} from "@/components/admin/upload-timeline-loader";
import { FileVideoPlayer } from "@/components/portfolio/file-video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadSiteMedia, deleteSiteMedia, type MediaKind, VIDEO_MAX_BYTES, VIDEO_MAX_MB } from "@/lib/media-upload";
import { optimizeImageFile, readImageDimensions } from "@/lib/image-optimize";
import { ReliableImage } from "@/components/media/reliable-image";
import { polishLabel } from "@/lib/typography";

const DEFAULT_PORTRAIT =
  "https://pub-f451e2de580d495e85d97dc9d8e4fb71.r2.dev/portfolio/about/1784816328559-542a8c04.jpg";
const FALLBACK_COVER = "/media/video-thumb-1.jpg";
const VIDEO_FILE_MAX_BYTES = VIDEO_MAX_BYTES;
const VIDEO_FILE_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

type AdminSectionId =
  | "hero"
  | "marquee"
  | "about"
  | "services"
  | "portfolio"
  | "experience"
  | "contact";

const ADMIN_SECTIONS: {
  id: AdminSectionId;
  label: string;
  title: string;
  description?: string;
}[] = [
  { id: "hero", label: "Hero", title: "Первый экран (Hero)" },
  { id: "marquee", label: "Строка", title: "Бегущая строка" },
  { id: "about", label: "Обо мне", title: "Обо мне" },
  { id: "services", label: "Услуги", title: "Услуги" },
  {
    id: "portfolio",
    label: "Портфолио",
    title: "Портфолио (видео)",
    description:
      "Каждая карточка — ролик в карусели. Сначала название и источник, затем файл или ссылка.",
  },
  { id: "experience", label: "Опыт", title: "Опыт" },
  { id: "contact", label: "Контакты", title: "Контакты" },
];

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** Remote CDN/Blob URL — safe to schedule for R2/Blob delete after CMS save. */
function isManagedRemoteMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function useUploadTimeline() {
  const [timeline, setTimeline] = useState<UploadTimelineState | null>(null);
  const uploading =
    timeline?.status === "preparing" || timeline?.status === "uploading";

  async function runUpload(
    file: File,
    options: { kind: MediaKind; folder: string },
  ): Promise<{ url: string; remuxed: boolean; size: number }> {
    setTimeline({
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: "preparing",
    });

    try {
      const result = await uploadSiteMedia(file, {
        ...options,
        onProgress: (progress) => {
          setTimeline((prev) =>
            prev
              ? {
                  ...prev,
                  fileSize: progress.total || prev.fileSize,
                  status: progress.phase === "done" ? "done" : progress.phase,
                  progress: progress.percentage,
                }
              : prev,
          );
        },
      });
      setTimeline((prev) =>
        prev
          ? {
              ...prev,
              status: "done",
              progress: 100,
              fileSize: result.size,
            }
          : prev,
      );
      return {
        url: result.url,
        remuxed: result.remuxed,
        size: result.size,
      };
    } catch (err: unknown) {
      const message = errorMessage(err, "Ошибка загрузки");
      setTimeline((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: message,
            }
          : {
              fileName: file.name,
              fileSize: file.size,
              progress: 0,
              status: "error",
              errorMessage: message,
            },
      );
      throw err;
    }
  }

  function clearTimeline() {
    setTimeline(null);
  }

  return { timeline, uploading, runUpload, clearTimeline };
}

function isDefaultPortrait(url: string): boolean {
  const trimmed = url.trim();
  return (
    !trimmed ||
    trimmed === DEFAULT_PORTRAIT ||
    trimmed === "/media/portrait.jpg"
  );
}

const ABOUT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ABOUT_IMAGE_MIN_WIDTH = 800;
const ABOUT_IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const COVER_IMAGE_MIN_WIDTH = 640;
const COVER_IMAGE_ALLOWED_TYPES = ABOUT_IMAGE_ALLOWED_TYPES;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель — Аркадий Амелин" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();

  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSectionId>("hero");

  /** Delete from R2 only after successful CMS save (avoid orphans / broken live URLs). */
  const pendingMediaDeletesRef = useRef<Set<string>>(new Set());

  function scheduleMediaDelete(url: string) {
    if (!isManagedRemoteMediaUrl(url)) return;
    pendingMediaDeletesRef.current.add(url.trim());
  }

  async function flushPendingMediaDeletes() {
    const urls = [...pendingMediaDeletesRef.current];
    pendingMediaDeletesRef.current.clear();
    if (!urls.length) return;
    await Promise.allSettled(urls.map((url) => deleteSiteMedia(url)));
  }

  async function loadAdmin() {
    setChecking(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setSignedIn(false);
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      setSignedIn(true);

      const adminData = await getAdminSiteContent();
      setIsAdmin(adminData.isAdmin);
      if (!adminData.isAdmin) {
        setChecking(false);
        return;
      }
      setContent(normalizeSiteContent(adminData.content ?? DEFAULT_CONTENT));
    } catch (err: unknown) {
      setStatus("Ошибка загрузки: " + errorMessage(err, "неизвестная ошибка"));
      setContent(normalizeSiteContent(DEFAULT_CONTENT));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadAdmin();
    } catch (err: unknown) {
      setLoginError(errorMessage(err, "Ошибка входа"));
    } finally {
      setLoggingIn(false);
    }
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setStatus(null);
    try {
      const savedContent = await saveAdminSiteContent({ data: content });
      const polished = normalizeSiteContent(savedContent);
      setContent(polished);
      queryClient.setQueryData(["site_content"], polished);
      await queryClient.invalidateQueries({ queryKey: ["site_content"], refetchType: "all" });
      await flushPendingMediaDeletes();
      setStatus("✓ Сохранено и обновлено на сайте");
    } catch (err: unknown) {
      setStatus("Ошибка сохранения: " + errorMessage(err, "неизвестная ошибка"));
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
    setIsAdmin(false);
    setContent(null);
    setEmail("");
    setPassword("");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {polishLabel("Загрузка…")}
      </div>
    );
  }

  if (!signedIn || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← {polishLabel("На сайт")}
          </Link>
          <h1 className="font-display mt-6 mb-2 text-4xl">{polishLabel("Вход в админку")}</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            {polishLabel("Введите email и пароль администратора.")}
          </p>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={adminControlClass}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">
                {polishLabel("Пароль")}
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={adminControlClass}
                autoComplete="current-password"
              />
            </div>
            {loginError && <StatusMessage tone="error">{loginError}</StatusMessage>}
            {signedIn && !isAdmin && (
              <StatusMessage tone="error">
                {polishLabel("Этот аккаунт не является администратором.")}
              </StatusMessage>
            )}
            <Button
              type="submit"
              disabled={loggingIn}
              className="h-11 w-full rounded-full bg-ember text-primary-foreground shadow-glow hover:bg-ember/90"
            >
              {loggingIn ? polishLabel("Вход…") : polishLabel("Войти")}
            </Button>
            {signedIn && (
              <Button
                type="button"
                variant="ghost"
                onClick={signOut}
                className="w-full text-muted-foreground"
              >
                {polishLabel("Выйти")}
              </Button>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {polishLabel("Загрузка…")}
      </div>
    );
  }

  const update = (patch: (draft: SiteContent) => void) => {
    const copy: SiteContent = JSON.parse(JSON.stringify(content));
    patch(copy);
    setContent(copy);
  };

  const currentSection =
    ADMIN_SECTIONS.find((section) => section.id === activeSection) ?? ADMIN_SECTIONS[0]!;

  function selectSection(id: AdminSectionId) {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="shrink-0 text-sm text-muted-foreground transition hover:text-foreground"
            >
              ← {polishLabel("На сайт")}
            </Link>
            <h1 className="font-display truncate text-lg sm:text-xl">
              {polishLabel("Админ-панель")}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {status ? (
              <span className="hidden max-w-[14rem] truncate text-sm text-primary sm:inline">
                {status}
              </span>
            ) : null}
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-9 rounded-full bg-ember px-4 text-primary-foreground shadow-glow hover:bg-ember/90 sm:px-5"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {polishLabel("Сохранение…")}
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  {polishLabel("Сохранить")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={signOut}
              className="hidden h-9 text-muted-foreground sm:inline-flex"
            >
              {polishLabel("Выйти")}
            </Button>
          </div>
        </div>

        <div className="border-t border-border/50">
          <nav
            aria-label={polishLabel("Разделы админки")}
            className="mx-auto max-w-4xl px-5 sm:px-6"
          >
            <div className="-mx-5 flex gap-1 overflow-x-auto px-5 py-2 sm:-mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ADMIN_SECTIONS.map((section) => {
                const active = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground"
                        : "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    }
                  >
                    {polishLabel(section.label)}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {status ? (
          <div className="border-t border-border/50 px-5 py-2 text-sm text-primary sm:hidden">
            {status}
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-4xl min-w-0 px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            {polishLabel(currentSection.title)}
          </h2>
          {currentSection.description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {polishLabel(currentSection.description)}
            </p>
          ) : null}
        </div>

        {activeSection === "hero" ? (
        <Section title={polishLabel(currentSection.title)} hideHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Имя (строка 1)")}
              value={content.hero.name1}
              onChange={(v) =>
                update((d) => {
                  d.hero.name1 = v;
                })
              }
            />
            <Field
              label={polishLabel("Имя (строка 2)")}
              value={content.hero.name2}
              onChange={(v) =>
                update((d) => {
                  d.hero.name2 = v;
                })
              }
            />
          </div>
          <TextArea
            label={polishLabel("Описание")}
            hint={polishLabel("Перенос строки — через Enter")}
            value={content.hero.description}
            onChange={(v) =>
              update((d) => {
                d.hero.description = v;
              })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Кнопка 1")}
              value={content.hero.ctaPrimary}
              onChange={(v) =>
                update((d) => {
                  d.hero.ctaPrimary = v;
                })
              }
            />
            <Field
              label={polishLabel("Кнопка 2")}
              value={content.hero.ctaSecondary}
              onChange={(v) =>
                update((d) => {
                  d.hero.ctaSecondary = v;
                })
              }
            />
          </div>
        </Section>
        ) : null}

        {activeSection === "marquee" ? (
        <Section title={polishLabel("Бегущая строка")} hideHeader>
          <ArrayEditor
            itemLabel={polishLabel("Фраза")}
            items={content.marquee}
            onChange={(v) =>
              update((d) => {
                d.marquee = v;
              })
            }
            render={(item, set) => <Field label="" value={item} onChange={set} />}
            newItem={() => "TEXT"}
          />
        </Section>
        ) : null}

        {activeSection === "about" ? (
        <Section title={polishLabel("Обо мне")} hideHeader>
          <AboutPortraitEditor
            imageUrl={content.about.imageUrl}
            scheduleMediaDelete={scheduleMediaDelete}
            onChange={(url) =>
              update((d) => {
                d.about.imageUrl = url;
              })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Подпись")}
              value={content.about.eyebrow}
              onChange={(v) =>
                update((d) => {
                  d.about.eyebrow = v;
                })
              }
            />
            <Field
              label={polishLabel("Заголовок")}
              polish="title"
              value={content.about.heading}
              onChange={(v) =>
                update((d) => {
                  d.about.heading = v;
                })
              }
            />
          </div>
          <Subsection title={polishLabel("Абзацы")}>
            <ArrayEditor
              itemLabel={polishLabel("Абзац")}
              items={content.about.paragraphs}
              onChange={(v) =>
                update((d) => {
                  d.about.paragraphs = v;
                })
              }
              render={(item, set) => <TextArea label="" value={item} onChange={set} />}
              newItem={() => ""}
            />
          </Subsection>
          <Subsection title={polishLabel("Цифры")}>
            <ArrayEditor
              itemLabel={polishLabel("Показатель")}
              items={content.about.stats}
              onChange={(v) =>
                update((d) => {
                  d.about.stats = v;
                })
              }
              render={(item, set) => (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={polishLabel("Число")}
                    polish="none"
                    value={item.n}
                    onChange={(v) => set({ ...item, n: v })}
                  />
                  <Field
                    label={polishLabel("Подпись")}
                    value={item.l}
                    onChange={(v) => set({ ...item, l: v })}
                  />
                </div>
              )}
              newItem={() => ({ n: "0", l: "" })}
            />
          </Subsection>
        </Section>
        ) : null}

        {activeSection === "services" ? (
        <Section title={polishLabel("Услуги")} hideHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Подпись")}
              value={content.services.eyebrow}
              onChange={(v) =>
                update((d) => {
                  d.services.eyebrow = v;
                })
              }
            />
            <Field
              label={polishLabel("Заголовок")}
              polish="title"
              value={content.services.heading}
              onChange={(v) =>
                update((d) => {
                  d.services.heading = v;
                })
              }
            />
          </div>
          <Subsection title={polishLabel("Карточки")}>
            <ArrayEditor
              itemLabel={polishLabel("Услуга")}
              items={content.services.items}
              onChange={(v) =>
                update((d) => {
                  d.services.items = v;
                })
              }
              render={(item, set) => (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
                    <Field
                      label={polishLabel("№")}
                      polish="none"
                      value={item.n}
                      onChange={(v) => set({ ...item, n: v })}
                    />
                    <Field
                      label={polishLabel("Заголовок")}
                      polish="title"
                      value={item.t}
                      onChange={(v) => set({ ...item, t: v })}
                    />
                  </div>
                  <TextArea
                    label={polishLabel("Описание")}
                    value={item.d}
                    onChange={(v) => set({ ...item, d: v })}
                  />
                  <Field
                    label={polishLabel("Теги")}
                    hint={polishLabel("Через запятую")}
                    polish="none"
                    value={item.tags.join(", ")}
                    onChange={(v) =>
                      set({
                        ...item,
                        tags: v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
              newItem={() => ({ n: "04", t: "", d: "", tags: [] })}
            />
          </Subsection>
        </Section>
        ) : null}

        {activeSection === "portfolio" ? (
        <Section title={polishLabel("Портфолио (видео)")} hideHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Подпись")}
              value={content.portfolio.eyebrow}
              onChange={(v) =>
                update((d) => {
                  d.portfolio.eyebrow = v;
                })
              }
            />
            <Field
              label={polishLabel("Заголовок")}
              polish="title"
              value={content.portfolio.heading}
              onChange={(v) =>
                update((d) => {
                  d.portfolio.heading = v;
                })
              }
            />
          </div>
          <Subsection title={polishLabel("Видео")}>
            <ArrayEditor<PortfolioVideo>
              itemLabel={polishLabel("Видео")}
              items={content.portfolio.videos}
              onChange={(v) =>
                update((d) => {
                  d.portfolio.videos = v;
                })
              }
              onRemoveItem={(item) => {
                if (item.source === "file") scheduleMediaDelete(item.url);
                scheduleMediaDelete(item.coverUrl);
              }}
              render={(item, set) => (
                <div className="space-y-4">
                  <Field
                    label={polishLabel("Название")}
                    polish="title"
                    value={item.title}
                    onChange={(v) => set({ ...item, title: v })}
                  />
                  <TextArea
                    label={polishLabel("Описание")}
                    value={item.desc}
                    onChange={(v) => set({ ...item, desc: v })}
                  />
                  <SegmentedControl
                    label={polishLabel("Источник")}
                    value={item.source}
                    options={[
                      { value: "file", label: polishLabel("Файл") },
                      { value: "youtube", label: "YouTube" },
                      { value: "vk", label: "VK" },
                    ]}
                    onChange={(source) => {
                      if (source === item.source) return;
                      if (item.source === "file") scheduleMediaDelete(item.url);
                      set({
                        ...item,
                        source,
                        url:
                          source === "file" || item.source === "file" ? "" : item.url,
                      });
                    }}
                  />
                  {item.source === "youtube" ? (
                    <StatusMessage tone="info">
                      {polishLabel(
                        "YouTube иногда показывает антибот-экран. Надёжнее загрузить свой MP4 или оставить кнопку «Смотреть на YouTube».",
                      )}
                    </StatusMessage>
                  ) : null}
                  {item.source === "file" ? (
                    <VideoFileEditor
                      video={item}
                      scheduleMediaDelete={scheduleMediaDelete}
                      onChange={(url) => set({ ...item, url, source: "file" })}
                    />
                  ) : (
                    <Field
                      label={
                        item.source === "vk"
                          ? polishLabel("Ссылка VK (embed)")
                          : polishLabel("Ссылка YouTube")
                      }
                      polish="none"
                      value={item.url}
                      onChange={(v) => set({ ...item, url: v })}
                      placeholder={
                        item.source === "vk"
                          ? "https://vk.com/video_ext.php?oid=...&id=...&hash=..."
                          : "https://www.youtube.com/watch?v=..."
                      }
                    />
                  )}
                  <VideoCoverEditor
                    video={item}
                    scheduleMediaDelete={scheduleMediaDelete}
                    onChange={(coverUrl) => set({ ...item, coverUrl })}
                  />
                  <Field
                    label={polishLabel("Теги")}
                    hint={polishLabel("Через запятую")}
                    polish="none"
                    value={item.tags.join(", ")}
                    onChange={(v) =>
                      set({
                        ...item,
                        tags: v
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
              newItem={() => ({
                title: "Новое видео",
                desc: "Краткое описание для карточки портфолио",
                tags: ["Live"],
                source: "file" as const,
                url: "",
                coverUrl: "",
              })}
            />
          </Subsection>
        </Section>
        ) : null}

        {activeSection === "experience" ? (
        <Section title={polishLabel("Опыт")} hideHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Подпись")}
              value={content.experience.eyebrow}
              onChange={(v) =>
                update((d) => {
                  d.experience.eyebrow = v;
                })
              }
            />
            <Field
              label={polishLabel("Заголовок")}
              polish="title"
              value={content.experience.heading}
              onChange={(v) =>
                update((d) => {
                  d.experience.heading = v;
                })
              }
            />
          </div>
          <ArrayEditor
            itemLabel={polishLabel("Запись")}
            items={content.experience.items}
            onChange={(v) =>
              update((d) => {
                d.experience.items = v;
              })
            }
            render={(item, set) => (
              <div className="grid gap-4 sm:grid-cols-[110px_1fr_1fr]">
                <Field
                  label={polishLabel("Год")}
                  polish="none"
                  value={item.y}
                  onChange={(v) => set({ ...item, y: v })}
                />
                <Field
                  label={polishLabel("Название")}
                  polish="title"
                  value={item.t}
                  onChange={(v) => set({ ...item, t: v })}
                />
                <Field
                  label={polishLabel("Описание")}
                  polish="body"
                  value={item.d}
                  onChange={(v) => set({ ...item, d: v })}
                />
              </div>
            )}
            newItem={() => ({ y: "2025", t: "", d: "" })}
          />
        </Section>
        ) : null}

        {activeSection === "contact" ? (
        <Section title={polishLabel("Контакты")} hideHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={polishLabel("Подпись")}
              value={content.contact.eyebrow}
              onChange={(v) =>
                update((d) => {
                  d.contact.eyebrow = v;
                })
              }
            />
            <Field
              label={polishLabel("Заголовок")}
              polish="title"
              value={content.contact.heading}
              onChange={(v) =>
                update((d) => {
                  d.contact.heading = v;
                })
              }
            />
          </div>
          <TextArea
            label={polishLabel("Описание")}
            value={content.contact.description}
            onChange={(v) =>
              update((d) => {
                d.contact.description = v;
              })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              polish="none"
              value={content.contact.email}
              onChange={(v) =>
                update((d) => {
                  d.contact.email = v;
                })
              }
            />
            <Field
              label={polishLabel("Телефон")}
              polish="none"
              value={content.contact.phone}
              onChange={(v) =>
                update((d) => {
                  d.contact.phone = v;
                })
              }
            />
          </div>
          <Subsection title={polishLabel("Соцсети")}>
            <p className="text-sm text-muted-foreground">
              {polishLabel(
                "Показываются в блоке «Контакты» и в мобильном меню. Пустая ссылка скрывает сеть на сайте.",
              )}
            </p>
            <SocialsEditor
              items={content.contact.socials}
              onChange={(v) =>
                update((d) => {
                  d.contact.socials = v;
                })
              }
            />
          </Subsection>
        </Section>
        ) : null}
      </main>
    </div>
  );
}

function ArrayEditor<T>({
  items,
  onChange,
  onRemoveItem,
  render,
  newItem,
  itemLabel = polishLabel("Элемент"),
  addLabel = polishLabel("Добавить"),
}: {
  items: T[];
  onChange: (v: T[]) => void;
  onRemoveItem?: (item: T) => void;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  newItem: () => T;
  itemLabel?: string;
  addLabel?: string;
}) {
  return (
    <div className="min-w-0 space-y-3">
      {items.map((item, i) => (
        <ItemCard
          key={i}
          title={`${itemLabel} ${i + 1}`}
          onRemove={() => {
            onRemoveItem?.(items[i]!);
            onChange(items.filter((_, j) => j !== i));
          }}
        >
          {render(item, (v) => {
            const copy = [...items];
            copy[i] = v;
            onChange(copy);
          })}
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, newItem()])}
        className="h-10 w-full border-dashed border-border/80 bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
      >
        + {addLabel}
      </Button>
    </div>
  );
}

function VideoFileEditor({
  video,
  onChange,
  scheduleMediaDelete,
}: {
  video: PortfolioVideo;
  onChange: (url: string) => void;
  scheduleMediaDelete: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { timeline, uploading, runUpload, clearTimeline } = useUploadTimeline();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const hasFile = Boolean(video.url.trim());

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);
    clearTimeline();

    if (!VIDEO_FILE_TYPES.has(file.type) && !/\.(mp4|m4v|webm|mov)$/i.test(file.name)) {
      setError("Формат видео: MP4, WebM или MOV.");
      return;
    }
    if (file.size > VIDEO_FILE_MAX_BYTES) {
      setError(`Файл больше ${VIDEO_MAX_MB} МБ. Сожмите видео и попробуйте снова.`);
      return;
    }

    try {
      const previousUrl = video.url.trim();
      const result = await runUpload(file, {
        kind: "video",
        folder: "portfolio/videos",
      });
      if (previousUrl && previousUrl !== result.url) {
        scheduleMediaDelete(previousUrl);
      }
      onChange(result.url);
      const sizeMb = (result.size / (1024 * 1024)).toFixed(1);
      const base = result.remuxed
        ? `Видео оптимизировано для мгновенного старта и загружено (${sizeMb} МБ).`
        : `Видео загружено (${sizeMb} МБ).`;
      setInfo(`${base} Не забудьте нажать «Сохранить».`);
    } catch (err: unknown) {
      setError(errorMessage(err, "Ошибка загрузки"));
    }
  }

  return (
    <MediaPanel title={polishLabel("Видеофайл")}>
      <p className="text-sm text-muted-foreground">
        {hasFile
          ? polishLabel("Файл на сервере — на сайте откроется сразу и догрузится по ходу.")
          : polishLabel(
              `MP4 (H.264 + AAC), WebM или MOV. Лимит ${VIDEO_MAX_MB} МБ — как у удобного веб-плеера.`,
            )}
      </p>
      <p className="text-xs text-muted-foreground">
        {polishLabel(
          "Перед загрузкой файл готовится для веба (faststart): старт сразу, остальное — по мере воспроизведения.",
        )}
      </p>

      {hasFile ? (
        <div className="min-w-0 space-y-3">
          <FileMeta name={fileNameFromUrl(video.url)} url={video.url} />
          <div className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-black">
            <FileVideoPlayer
              key={video.url}
              src={video.url}
              title={video.title}
              className="aspect-video max-h-56 w-full"
              autoPlay={false}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.m4v,.webm,.mov"
          className="sr-only"
          onChange={onFileChange}
        />
        <Button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-9 rounded-full bg-ember px-4 text-primary-foreground shadow-glow hover:bg-ember/90"
        >
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {polishLabel("Загрузка…")}
            </>
          ) : (
            <>
              <Upload className="size-3.5" />
              {hasFile ? polishLabel("Заменить видео") : polishLabel("Загрузить видео")}
            </>
          )}
        </Button>
        {hasFile ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => {
              const previousUrl = video.url.trim();
              setError(null);
              clearTimeline();
              if (previousUrl) scheduleMediaDelete(previousUrl);
              onChange("");
              setInfo("Видео убрано. Нажмите «Сохранить» — файл удалится из хранилища.");
            }}
            className="text-muted-foreground hover:text-red-400"
          >
            {polishLabel("Удалить файл")}
          </Button>
        ) : null}
      </div>

      {timeline ? <UploadTimelineLoader state={timeline} /> : null}
      {error && !timeline ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {!error && info ? <StatusMessage tone="success">{info}</StatusMessage> : null}
    </MediaPanel>
  );
}

function AboutPortraitEditor({
  imageUrl,
  onChange,
  scheduleMediaDelete,
}: {
  imageUrl: string;
  onChange: (url: string) => void;
  scheduleMediaDelete: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { timeline, uploading, runUpload, clearTimeline } = useUploadTimeline();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const displaySrc = imageUrl.trim() || DEFAULT_PORTRAIT;
  const isCustom = !isDefaultPortrait(imageUrl);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);
    clearTimeline();

    if (!ABOUT_IMAGE_ALLOWED_TYPES.has(file.type)) {
      setError("Формат: JPEG, PNG или WebP.");
      return;
    }
    if (file.size > ABOUT_IMAGE_MAX_BYTES) {
      setError("Файл больше 5 МБ. Сожмите фото и попробуйте снова.");
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      if (width < ABOUT_IMAGE_MIN_WIDTH) {
        setError(
          `Слишком маленькое фото: ${width}×${height}. Минимум по ширине — ${ABOUT_IMAGE_MIN_WIDTH} px.`,
        );
        return;
      }

      const prepared = await optimizeImageFile(file, {
        aspect: "portrait",
        maxWidth: 1024,
        maxHeight: 1280,
        quality: 0.84,
        preferWebp: true,
        fileName: file.name,
      });

      setInfo(
        prepared.optimized
          ? `Готово ${prepared.width}×${prepared.height} (из ${prepared.sourceWidth}×${prepared.sourceHeight}, кадр 4:5). Не забудьте нажать «Сохранить».`
          : `Загружено ${prepared.width}×${prepared.height}. Не забудьте нажать «Сохранить».`,
      );

      const previousUrl = imageUrl.trim();
      const publicUrl = (
        await runUpload(prepared.file, { kind: "image", folder: "portfolio/about" })
      ).url;
      if (previousUrl && !isDefaultPortrait(previousUrl) && previousUrl !== publicUrl) {
        scheduleMediaDelete(previousUrl);
      }
      onChange(publicUrl);
    } catch (err: unknown) {
      setError(errorMessage(err, "Ошибка загрузки"));
    }
  }

  return (
    <MediaPanel title={polishLabel("Фото в блоке «Обо мне»")}>
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/5] w-[132px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted/20 sm:mx-0">
          <ReliableImage
            src={displaySrc}
            fallbackSrc={DEFAULT_PORTRAIT}
            alt={polishLabel("Превью портрета")}
            className="h-full w-full object-cover object-[center_28%]"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">
            {isCustom
              ? polishLabel("Сейчас на сайте — загруженное фото.")
              : polishLabel("Сейчас на сайте — фото по умолчанию.")}
          </p>
          <ul className="grid list-disc gap-1 pl-4 text-xs leading-relaxed sm:grid-cols-2 sm:gap-x-6">
            <li>
              <span className="text-foreground">JPEG / PNG / WebP</span>
            </li>
            <li>
              <span className="text-foreground">4:5</span>, от {ABOUT_IMAGE_MIN_WIDTH} px
            </li>
            <li>
              <span className="text-foreground">Авто:</span> кадр 4:5 → WebP
            </li>
            <li>
              <span className="text-foreground">До 5 МБ</span>
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
            />
            <Button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="h-9 rounded-full bg-ember px-4 text-primary-foreground shadow-glow hover:bg-ember/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {polishLabel("Загрузка…")}
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  {polishLabel("Загрузить фото")}
                </>
              )}
            </Button>
            {isCustom ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  scheduleMediaDelete(imageUrl);
                  onChange("");
                  clearTimeline();
                  setError(null);
                  setInfo("Вернули фото по умолчанию. Нажмите «Сохранить».");
                }}
                className="text-muted-foreground"
              >
                {polishLabel("Сбросить")}
              </Button>
            ) : null}
          </div>

          {timeline ? <UploadTimelineLoader state={timeline} /> : null}
          {error && !timeline ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          {!error && info ? <StatusMessage tone="success">{info}</StatusMessage> : null}
        </div>
      </div>
    </MediaPanel>
  );
}

function VideoCoverEditor({
  video,
  onChange,
  scheduleMediaDelete,
}: {
  video: PortfolioVideo;
  onChange: (coverUrl: string) => void;
  scheduleMediaDelete: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { timeline, uploading, runUpload, clearTimeline } = useUploadTimeline();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const autoThumb = video.source === "youtube" ? getYoutubeThumbnail(video.url) : null;
  const displaySrc = resolvePortfolioCover(video, FALLBACK_COVER);
  const isCustom = Boolean(video.coverUrl.trim());

  let sourceLabel = polishLabel("запасная обложка сайта");
  if (isCustom) sourceLabel = polishLabel("загруженная обложка");
  else if (autoThumb) sourceLabel = polishLabel("превью YouTube");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);
    clearTimeline();

    if (!COVER_IMAGE_ALLOWED_TYPES.has(file.type)) {
      setError("Формат: JPEG, PNG или WebP.");
      return;
    }
    if (file.size > COVER_IMAGE_MAX_BYTES) {
      setError("Файл больше 5 МБ. Сожмите картинку и попробуйте снова.");
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      if (width < COVER_IMAGE_MIN_WIDTH) {
        setError(
          `Слишком маленькое фото: ${width}×${height}. Минимум по ширине — ${COVER_IMAGE_MIN_WIDTH} px.`,
        );
        return;
      }

      const prepared = await optimizeImageFile(file, {
        aspect: "video",
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.84,
        preferWebp: true,
        fileName: file.name,
      });

      setInfo(
        prepared.optimized
          ? `Готово ${prepared.width}×${prepared.height} (из ${prepared.sourceWidth}×${prepared.sourceHeight}, кадр 16:9). Не забудьте нажать «Сохранить».`
          : `Загружено ${prepared.width}×${prepared.height}. Не забудьте нажать «Сохранить».`,
      );

      const previousUrl = video.coverUrl.trim();
      const publicUrl = (
        await runUpload(prepared.file, { kind: "image", folder: "portfolio/covers" })
      ).url;
      if (previousUrl && previousUrl !== publicUrl) {
        scheduleMediaDelete(previousUrl);
      }
      onChange(publicUrl);
    } catch (err: unknown) {
      setError(errorMessage(err, "Ошибка загрузки"));
    }
  }

  return (
    <MediaPanel title={polishLabel("Обложка в карусели")}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative aspect-video w-full max-w-[220px] overflow-hidden rounded-lg border border-border bg-muted/20">
          <ReliableImage
            src={displaySrc}
            fallbackSrc={FALLBACK_COVER}
            alt={polishLabel("Превью обложки")}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>

        <div className="min-w-0 space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">
            {polishLabel("Сейчас:")} {sourceLabel}.
          </p>
          <p className="text-xs leading-relaxed">
            {polishLabel("Любой кадр — автоматически обрежем в 16:9")} (до 1280×720, WebP/JPEG). Исходник
            от {COVER_IMAGE_MIN_WIDTH} px по ширине, до 5 МБ.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="h-9 rounded-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {polishLabel("Загрузка…")}
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  {polishLabel("Загрузить обложку")}
                </>
              )}
            </Button>
            {isCustom ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  scheduleMediaDelete(video.coverUrl);
                  onChange("");
                  clearTimeline();
                  setError(null);
                  setInfo(
                    autoThumb
                      ? "Вернули превью YouTube. Нажмите «Сохранить»."
                      : "Сбросили свою обложку. Нажмите «Сохранить».",
                  );
                }}
                className="text-muted-foreground"
              >
                {polishLabel("Сбросить на авто")}
              </Button>
            ) : null}
          </div>

          {timeline ? <UploadTimelineLoader state={timeline} /> : null}
          {error && !timeline ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          {!error && info ? <StatusMessage tone="success">{info}</StatusMessage> : null}
        </div>
      </div>
    </MediaPanel>
  );
}

const CORE_SOCIAL_LABELS = ["Telegram", "Instagram", "VK"] as const;

function SocialsEditor({
  items,
  onChange,
}: {
  items: SiteContent["contact"]["socials"];
  onChange: (v: SiteContent["contact"]["socials"]) => void;
}) {
  const setAt = (index: number, next: SiteContent["contact"]["socials"][number]) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isCore = CORE_SOCIAL_LABELS.some(
          (label) => label.toLowerCase() === item.label.toLowerCase(),
        );
        return (
          <ItemCard
            key={i}
            title={item.label || polishLabel(`Соцсеть ${i + 1}`)}
            onRemove={isCore ? undefined : () => onChange(items.filter((_, j) => j !== i))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {isCore ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground/90">
                    {polishLabel("Название")}
                  </p>
                  <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/25 px-3.5 text-sm">
                    {item.label}
                  </div>
                </div>
              ) : (
                <Field
                  label={polishLabel("Название")}
                  value={item.label}
                  onChange={(v) => setAt(i, { ...item, label: v })}
                />
              )}
              <Field
                label={polishLabel("Ссылка")}
                polish="none"
                value={item.url}
                onChange={(v) => setAt(i, { ...item, url: v })}
                placeholder="https://"
              />
            </div>
          </ItemCard>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, { label: "", url: "" }])}
        className="h-10 w-full border-dashed border-border/80 bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
      >
        + {polishLabel("Добавить соцсеть")}
      </Button>
    </div>
  );
}
