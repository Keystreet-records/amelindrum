import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CONTENT,
  getYoutubeThumbnail,
  resolvePortfolioCover,
  type PortfolioVideo,
  type SiteContent,
} from "@/lib/site-content";
import { getAdminSiteContent, saveAdminSiteContent } from "@/lib/site-content.functions";
import { uploadSiteMedia } from "@/lib/media-upload";

const DEFAULT_PORTRAIT = "/media/portrait.jpg";
const FALLBACK_COVER = "/media/video-thumb-1.jpg";
const VIDEO_FILE_MAX_BYTES = 200 * 1024 * 1024;
const VIDEO_FILE_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
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
      setContent(adminData.content ?? DEFAULT_CONTENT);
    } catch (err: unknown) {
      setStatus("Ошибка загрузки: " + errorMessage(err, "неизвестная ошибка"));
      setContent(DEFAULT_CONTENT);
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
      setContent(savedContent);
      queryClient.setQueryData(["site_content"], savedContent);
      await queryClient.invalidateQueries({ queryKey: ["site_content"], refetchType: "all" });
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  if (!signedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← На сайт
          </Link>
          <h1 className="font-display text-4xl mt-6 mb-2">Вход в админку</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Введите email и пароль администратора.
          </p>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            {loginError && <div className="text-sm text-red-400">{loginError}</div>}
            {signedIn && !isAdmin && (
              <div className="text-sm text-red-400">Этот аккаунт не является администратором.</div>
            )}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-full bg-ember px-6 py-3.5 font-medium text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50 transition"
            >
              {loggingIn ? "Загрузка..." : "Войти"}
            </button>
            {signedIn && (
              <button
                type="button"
                onClick={signOut}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Выйти
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  const update = (patch: (draft: SiteContent) => void) => {
    const copy: SiteContent = JSON.parse(JSON.stringify(content));
    patch(copy);
    setContent(copy);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← На сайт
            </Link>
            <h1 className="font-display text-xl">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-3">
            {status && <span className="text-sm text-primary">{status}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-ember px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {saving ? "..." : "Сохранить"}
            </button>
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-12">
        <Section title="Первый экран (Hero)">
          <Field
            label="Имя (строка 1)"
            value={content.hero.name1}
            onChange={(v) =>
              update((d) => {
                d.hero.name1 = v;
              })
            }
          />
          <Field
            label="Имя (строка 2)"
            value={content.hero.name2}
            onChange={(v) =>
              update((d) => {
                d.hero.name2 = v;
              })
            }
          />
          <TextArea
            label="Описание (\n = перенос строки)"
            value={content.hero.description}
            onChange={(v) =>
              update((d) => {
                d.hero.description = v;
              })
            }
          />
          <Field
            label="Кнопка 1"
            value={content.hero.ctaPrimary}
            onChange={(v) =>
              update((d) => {
                d.hero.ctaPrimary = v;
              })
            }
          />
          <Field
            label="Кнопка 2"
            value={content.hero.ctaSecondary}
            onChange={(v) =>
              update((d) => {
                d.hero.ctaSecondary = v;
              })
            }
          />
        </Section>

        <Section title="Бегущая строка">
          <ArrayEditor
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

        <Section title="Обо мне">
          <AboutPortraitEditor
            imageUrl={content.about.imageUrl}
            onChange={(url) =>
              update((d) => {
                d.about.imageUrl = url;
              })
            }
          />
          <Field
            label="Подпись"
            value={content.about.eyebrow}
            onChange={(v) =>
              update((d) => {
                d.about.eyebrow = v;
              })
            }
          />
          <Field
            label="Заголовок"
            value={content.about.heading}
            onChange={(v) =>
              update((d) => {
                d.about.heading = v;
              })
            }
          />
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Абзацы</div>
          <ArrayEditor
            items={content.about.paragraphs}
            onChange={(v) =>
              update((d) => {
                d.about.paragraphs = v;
              })
            }
            render={(item, set) => <TextArea label="" value={item} onChange={set} />}
            newItem={() => ""}
          />
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Цифры</div>
          <ArrayEditor
            items={content.about.stats}
            onChange={(v) =>
              update((d) => {
                d.about.stats = v;
              })
            }
            render={(item, set) => (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Число" value={item.n} onChange={(v) => set({ ...item, n: v })} />
                <Field label="Подпись" value={item.l} onChange={(v) => set({ ...item, l: v })} />
              </div>
            )}
            newItem={() => ({ n: "0", l: "" })}
          />
        </Section>

        <Section title="Услуги">
          <Field
            label="Подпись"
            value={content.services.eyebrow}
            onChange={(v) =>
              update((d) => {
                d.services.eyebrow = v;
              })
            }
          />
          <Field
            label="Заголовок"
            value={content.services.heading}
            onChange={(v) =>
              update((d) => {
                d.services.heading = v;
              })
            }
          />
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
            Карточки
          </div>
          <ArrayEditor
            items={content.services.items}
            onChange={(v) =>
              update((d) => {
                d.services.items = v;
              })
            }
            render={(item, set) => (
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <Field label="№" value={item.n} onChange={(v) => set({ ...item, n: v })} />
                  <Field
                    label="Заголовок"
                    value={item.t}
                    onChange={(v) => set({ ...item, t: v })}
                  />
                </div>
                <TextArea
                  label="Описание"
                  value={item.d}
                  onChange={(v) => set({ ...item, d: v })}
                />
                <Field
                  label="Теги (через запятую)"
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
        </Section>

        <Section title="Портфолио (видео)">
          <Field
            label="Подпись"
            value={content.portfolio.eyebrow}
            onChange={(v) =>
              update((d) => {
                d.portfolio.eyebrow = v;
              })
            }
          />
          <Field
            label="Заголовок"
            value={content.portfolio.heading}
            onChange={(v) =>
              update((d) => {
                d.portfolio.heading = v;
              })
            }
          />
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Видео</div>
          <ArrayEditor<PortfolioVideo>
            items={content.portfolio.videos}
            onChange={(v) =>
              update((d) => {
                d.portfolio.videos = v;
              })
            }
            render={(item, set) => (
              <div className="space-y-2">
                <Field
                  label="Название"
                  value={item.title}
                  onChange={(v) => set({ ...item, title: v })}
                />
                <TextArea
                  label="Описание"
                  value={item.desc}
                  onChange={(v) => set({ ...item, desc: v })}
                />
                <label className="block">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Источник
                  </div>
                  <select
                    value={item.source}
                    onChange={(e) =>
                      set({
                        ...item,
                        source: e.target.value as PortfolioVideo["source"],
                        url: e.target.value === "file" ? "" : item.url,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="file">Файл (загрузка)</option>
                    <option value="youtube">YouTube</option>
                    <option value="vk">VK</option>
                  </select>
                </label>
                {item.source === "file" ? (
                  <VideoFileEditor
                    video={item}
                    onChange={(url) => set({ ...item, url, source: "file" })}
                  />
                ) : (
                  <Field
                    label={item.source === "vk" ? "VK ссылка (embed)" : "YouTube ссылка"}
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
                  onChange={(coverUrl) => set({ ...item, coverUrl })}
                />
                <Field
                  label="Теги (через запятую)"
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
        </Section>

        <Section title="Опыт">
          <Field
            label="Подпись"
            value={content.experience.eyebrow}
            onChange={(v) =>
              update((d) => {
                d.experience.eyebrow = v;
              })
            }
          />
          <Field
            label="Заголовок"
            value={content.experience.heading}
            onChange={(v) =>
              update((d) => {
                d.experience.heading = v;
              })
            }
          />
          <ArrayEditor
            items={content.experience.items}
            onChange={(v) =>
              update((d) => {
                d.experience.items = v;
              })
            }
            render={(item, set) => (
              <div className="grid grid-cols-[100px_1fr_1fr] gap-2">
                <Field label="Год" value={item.y} onChange={(v) => set({ ...item, y: v })} />
                <Field label="Название" value={item.t} onChange={(v) => set({ ...item, t: v })} />
                <Field label="Описание" value={item.d} onChange={(v) => set({ ...item, d: v })} />
              </div>
            )}
            newItem={() => ({ y: "2025", t: "", d: "" })}
          />
        </Section>

        <Section title="Контакты">
          <Field
            label="Подпись"
            value={content.contact.eyebrow}
            onChange={(v) =>
              update((d) => {
                d.contact.eyebrow = v;
              })
            }
          />
          <Field
            label="Заголовок"
            value={content.contact.heading}
            onChange={(v) =>
              update((d) => {
                d.contact.heading = v;
              })
            }
          />
          <TextArea
            label="Описание"
            value={content.contact.description}
            onChange={(v) =>
              update((d) => {
                d.contact.description = v;
              })
            }
          />
          <Field
            label="Email"
            value={content.contact.email}
            onChange={(v) =>
              update((d) => {
                d.contact.email = v;
              })
            }
          />
          <Field
            label="Телефон"
            value={content.contact.phone}
            onChange={(v) =>
              update((d) => {
                d.contact.phone = v;
              })
            }
          />
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
            Соцсети
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Показываются в блоке «Контакты» и в мобильном меню. Пустая ссылка скрывает сеть на
            сайте.
          </p>
          <SocialsEditor
            items={content.contact.socials}
            onChange={(v) =>
              update((d) => {
                d.contact.socials = v;
              })
            }
          />
        </Section>

        <div className="pb-20 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-ember px-8 py-3.5 font-medium text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить все изменения"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}

function VideoFileEditor({
  video,
  onChange,
}: {
  video: PortfolioVideo;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const hasFile = Boolean(video.url.trim());

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);

    if (!VIDEO_FILE_TYPES.has(file.type)) {
      setError("Формат видео: MP4, WebM или MOV.");
      return;
    }
    if (file.size > VIDEO_FILE_MAX_BYTES) {
      setError("Файл больше 200 МБ. Сожмите видео и попробуйте снова.");
      return;
    }

    try {
      setUploading(true);
      const publicUrl = await uploadSiteMedia(file, { kind: "video", folder: "portfolio/videos" });
      onChange(publicUrl);
      setInfo("Видео загружено. Не забудьте нажать «Сохранить».");
    } catch (err: unknown) {
      const message = errorMessage(err, "Ошибка загрузки");
      if (/BLOB_READ_WRITE_TOKEN|503|не задан/i.test(message)) {
        setError(
          "Хранилище Vercel Blob не настроено. В Vercel создайте Blob Store — токен BLOB_READ_WRITE_TOKEN подтянется сам.",
        );
      } else {
        setError(message);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Видеофайл</div>
      <p className="text-sm text-muted-foreground">
        {hasFile
          ? "Файл загружен на Vercel Blob. На сайте откроется плеер."
          : "Загрузите ролик с компьютера (MP4 / WebM / MOV, до 200 МБ)."}
      </p>
      {hasFile && (
        <p className="truncate text-xs text-primary" title={video.url}>
          {video.url}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="sr-only"
          onChange={onFileChange}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {uploading ? "Загрузка..." : hasFile ? "Заменить видео" : "Загрузить видео"}
        </button>
        {hasFile && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              onChange("");
              setError(null);
              setInfo("Видео убрано. Нажмите «Сохранить».");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Удалить файл
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && info && <p className="text-sm text-primary">{info}</p>}
    </div>
  );
}

function AboutPortraitEditor({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const displaySrc = imageUrl.trim() || DEFAULT_PORTRAIT;
  const isCustom = Boolean(imageUrl.trim());

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);

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

      const ratio = width / height;
      const target = 4 / 5;
      const ratioOk = Math.abs(ratio - target) <= 0.08;
      if (!ratioOk) {
        setInfo(
          `Размер ${width}×${height}. Соотношение не 4:5 — на сайте фото обрежется (object-cover). Лучше кадрировать заранее.`,
        );
      } else {
        setInfo(`Загружено ${width}×${height}. Не забудьте нажать «Сохранить».`);
      }

      setUploading(true);
      const publicUrl = await uploadSiteMedia(file, { kind: "image", folder: "about" });
      onChange(publicUrl);
    } catch (err: unknown) {
      const message = errorMessage(err, "Ошибка загрузки");
      if (/BLOB_READ_WRITE_TOKEN|503|не задан/i.test(message)) {
        setError(
          "Хранилище Vercel Blob не настроено. В Vercel создайте Blob Store — токен BLOB_READ_WRITE_TOKEN подтянется сам.",
        );
      } else {
        setError(message);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Фото в блоке «Обо мне»
      </div>

      <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-[140px] overflow-hidden rounded-xl border border-border bg-muted/20 sm:mx-0">
          <img
            src={displaySrc}
            alt="Превью портрета"
            className="h-full w-full object-cover object-[center_28%]"
          />
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">
            {isCustom
              ? "Сейчас на сайте — загруженное фото."
              : "Сейчас на сайте — фото по умолчанию."}
          </p>
          <ul className="list-disc space-y-1.5 pl-4 leading-relaxed">
            <li>
              <span className="text-foreground">Формат:</span> JPEG, PNG или WebP
            </li>
            <li>
              <span className="text-foreground">Соотношение сторон:</span> 4:5 (портрет), например{" "}
              <span className="text-foreground">1024×1536</span> или{" "}
              <span className="text-foreground">1200×1500</span>
            </li>
            <li>
              <span className="text-foreground">Минимум:</span> ширина от {ABOUT_IMAGE_MIN_WIDTH} px
            </li>
            <li>
              <span className="text-foreground">Рекомендуемо:</span> 1024×1536 px (как текущий
              портрет)
            </li>
            <li>
              <span className="text-foreground">Вес файла:</span> до 5 МБ
            </li>
            <li>
              Лицо и верх тела — ближе к верхней трети кадра: на сайте кадр чуть обрезается
              сверху/снизу
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {uploading ? "Загрузка..." : "Загрузить фото"}
            </button>
            {isCustom && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  onChange("");
                  setError(null);
                  setInfo("Вернули фото по умолчанию. Нажмите «Сохранить».");
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Сбросить на стандартное
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {!error && info && <p className="text-sm text-primary">{info}</p>}
        </div>
      </div>
    </div>
  );
}

function VideoCoverEditor({
  video,
  onChange,
}: {
  video: PortfolioVideo;
  onChange: (coverUrl: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const autoThumb = video.source === "youtube" ? getYoutubeThumbnail(video.url) : null;
  const displaySrc = resolvePortfolioCover(video, FALLBACK_COVER);
  const isCustom = Boolean(video.coverUrl.trim());

  let sourceLabel = "запасная обложка сайта";
  if (isCustom) sourceLabel = "загруженная обложка";
  else if (autoThumb) sourceLabel = "превью YouTube";

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setInfo(null);

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

      const ratio = width / height;
      const target = 16 / 9;
      if (Math.abs(ratio - target) > 0.12) {
        setInfo(
          `Размер ${width}×${height}. Соотношение не 16:9 — в карточке обложка обрежется. Лучше кадрировать заранее.`,
        );
      } else {
        setInfo(`Загружено ${width}×${height}. Не забудьте нажать «Сохранить».`);
      }

      setUploading(true);
      const publicUrl = await uploadSiteMedia(file, { kind: "image", folder: "portfolio" });
      onChange(publicUrl);
    } catch (err: unknown) {
      const message = errorMessage(err, "Ошибка загрузки");
      if (/BLOB_READ_WRITE_TOKEN|503|не задан/i.test(message)) {
        setError(
          "Хранилище Vercel Blob не настроено. В Vercel создайте Blob Store — токен BLOB_READ_WRITE_TOKEN подтянется сам.",
        );
      } else {
        setError(message);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Обложка в карусели
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div className="relative mx-auto aspect-video w-full max-w-[160px] overflow-hidden rounded-lg border border-border bg-muted/20 sm:mx-0">
          <img src={displaySrc} alt="Превью обложки" className="h-full w-full object-cover" />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="text-foreground">Сейчас: {sourceLabel}.</p>
          <p className="text-xs leading-relaxed">
            Картинка для превью карточки в карусели. Лучше горизонтальный кадр{" "}
            <span className="text-foreground">16:9</span> — например{" "}
            <span className="text-foreground">1280×720</span> или{" "}
            <span className="text-foreground">1920×1080</span> px. Форматы: JPEG, PNG или WebP,
            ширина от {COVER_IMAGE_MIN_WIDTH} px, вес до 5 МБ. Важный сюжет держите ближе к центру:
            края могут чуть обрезаться.
          </p>
          <p className="text-xs leading-relaxed">
            Если обложку не загружать: для YouTube подставится превью ролика, для VK — запасная
            картинка сайта.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {uploading ? "Загрузка..." : "Загрузить обложку"}
            </button>
            {isCustom && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  onChange("");
                  setError(null);
                  setInfo(
                    autoThumb
                      ? "Вернули превью YouTube. Нажмите «Сохранить»."
                      : "Сбросили свою обложку. Нажмите «Сохранить».",
                  );
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Сбросить на авто
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {!error && info && <p className="text-sm text-primary">{info}</p>}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      {label && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
          {label}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      {label && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
          {label}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </label>
  );
}

function ArrayEditor<T>({
  items,
  onChange,
  render,
  newItem,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  newItem: () => T;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border/70 bg-background/60 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {render(item, (v) => {
                const copy = [...items];
                copy[i] = v;
                onChange(copy);
              })}
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-xs text-red-400 hover:text-red-300 shrink-0 mt-1"
              aria-label="Удалить"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="text-sm text-primary hover:opacity-80"
      >
        + Добавить
      </button>
    </div>
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
          <div key={i} className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {isCore ? (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Название
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm">
                      {item.label}
                    </div>
                  </div>
                ) : (
                  <Field
                    label="Название"
                    value={item.label}
                    onChange={(v) => setAt(i, { ...item, label: v })}
                  />
                )}
                <Field
                  label="Ссылка"
                  value={item.url}
                  onChange={(v) => setAt(i, { ...item, url: v })}
                  placeholder="https://"
                />
              </div>
              {!isCore && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-300 shrink-0 mt-1"
                  aria-label="Удалить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...items, { label: "", url: "" }])}
        className="text-sm text-primary hover:opacity-80"
      >
        + Добавить соцсеть
      </button>
    </div>
  );
}
