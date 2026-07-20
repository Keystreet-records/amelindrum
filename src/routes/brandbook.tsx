import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoSweep from "@/assets/logo/amelin-logo-sweep.svg?url";
import logoSweepHero from "@/assets/logo/amelin-logo-sweep-hero.svg?url";
import logoTag from "@/assets/logo/amelin-logo-tag.svg?url";
import logoVapor from "@/assets/logo/amelin-logo-vapor-ink.svg?url";
import logoFashion from "@/assets/logo/amelin-logo-fashion.svg?url";

export const Route = createFileRoute("/brandbook")({
  head: () => ({
    meta: [
      { title: "Брендбук — Аркадий Амелин" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Логотипы, шрифты и цвета бренда Аркадий Амелин.",
      },
    ],
  }),
  component: BrandbookPage,
});

const COLORS = [
  {
    name: "Background",
    token: "--background",
    value: "oklch(0.22 0.016 255)",
    hex: "#2A2E36",
    usage: "Основной фон сайта",
    swatch: "bg-background border border-border",
  },
  {
    name: "Foreground",
    token: "--foreground",
    value: "oklch(0.96 0.008 255)",
    hex: "#F2F3F5",
    usage: "Основной текст",
    swatch: "bg-foreground",
  },
  {
    name: "Primary",
    token: "--primary",
    value: "oklch(0.65 0.18 145)",
    hex: "#4DB84D",
    usage: "Акцент, CTA, точки ритма",
    swatch: "bg-primary",
  },
  {
    name: "Ember",
    token: "--ember",
    value: "oklch(0.60 0.20 145)",
    hex: "#3FA63F",
    usage: "Градиенты кнопок, акценты заголовков",
    swatch: "bg-ember",
  },
  {
    name: "Copper / Accent",
    token: "--copper / --accent",
    value: "oklch(0.80 0.22 120)",
    hex: "#B8E04A",
    usage: "Светлый край градиента ember",
    swatch: "bg-copper",
  },
  {
    name: "Card",
    token: "--card",
    value: "oklch(0.15 0.018 255)",
    hex: "#1A1D24",
    usage: "Карточки, панели",
    swatch: "bg-card border border-border",
  },
  {
    name: "Muted",
    token: "--muted-foreground",
    value: "oklch(0.72 0.02 255)",
    hex: "#A8AEB8",
    usage: "Вторичный текст",
    swatch: "bg-muted-foreground",
  },
  {
    name: "Border",
    token: "--border",
    value: "oklch(0.34 0.02 255)",
    hex: "#4A505C",
    usage: "Разделители, обводки",
    swatch: "bg-border",
  },
] as const;

const LOGOS = [
  {
    id: "wordmark",
    title: "Wordmark AM#",
    note: "Навигация и мобильное меню. Точка primary + AM#.",
    kind: "wordmark" as const,
  },
  {
    id: "sweep-hero",
    title: "Автограф · Hero",
    note: "Основной логотип первого экрана (подрезанный viewBox).",
    src: logoSweepHero,
    kind: "svg" as const,
  },
  {
    id: "sweep",
    title: "Автограф · полный",
    note: "Исходный размашистый SVG-автограф.",
    src: logoSweep,
    kind: "svg" as const,
  },
  {
    id: "tag",
    title: "Тег",
    note: "Двухстрочный lockup в духе стрит-тега.",
    src: logoTag,
    kind: "svg" as const,
  },
  {
    id: "vapor",
    title: "Signature line",
    note: "Одна непрерывная каллиграфическая линия.",
    src: logoVapor,
    kind: "svg" as const,
  },
  {
    id: "fashion",
    title: "Fashion",
    note: "Более спокойный editorial-вариант автографа.",
    src: logoFashion,
    kind: "svg" as const,
  },
] as const;

function BrandbookPage() {
  return (
    <div className="brandbook min-h-screen bg-background text-foreground">
      <header className="brandbook-header sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Аркадий Амелин</p>
            <h1 className="mt-1 font-display text-2xl md:text-3xl">Брендбук</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <a href="#logos" className="text-muted-foreground hover:text-foreground">
              Логотипы
            </a>
            <a href="#colors" className="text-muted-foreground hover:text-foreground">
              Цвета
            </a>
            <a href="#type" className="text-muted-foreground hover:text-foreground">
              Шрифты
            </a>
            <Link
              to="/"
              className="rounded-full border border-border px-4 py-2 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              ← На сайт
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-10 md:py-14">
        <section className="max-w-2xl space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-primary">Brand system</p>
          <h2 className="font-display text-3xl leading-tight md:text-5xl">
            Графит, лайм и размашистая подпись.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Визуальная система сайта сессионного барабанщика: тёмный graphite-фон, зелёный акцент,
            шрифты Onest / Golos Text и каллиграфические логотипы-автографы.
          </p>
        </section>

        {/* Logos */}
        <section id="logos" className="space-y-6 scroll-mt-28">
          <div className="space-y-2">
            <h2 className="font-display text-2xl md:text-3xl">Логотипы</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              На сайте в Hero используется «Автограф · Hero». Остальные варианты — запасные lockup’ы
              из серии каллиграфии.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {LOGOS.map((logo) => (
              <article
                key={logo.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/50"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
                  <div>
                    <h3 className="font-display text-lg">{logo.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{logo.note}</p>
                  </div>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <LogoSurface tone="dark">
                    {logo.kind === "wordmark" ? <Wordmark /> : <LogoImg src={logo.src} invert />}
                  </LogoSurface>
                  <LogoSurface tone="light">
                    {logo.kind === "wordmark" ? <Wordmark onLight /> : <LogoImg src={logo.src} />}
                  </LogoSurface>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section id="colors" className="space-y-6 scroll-mt-28">
          <div className="space-y-2">
            <h2 className="font-display text-2xl md:text-3xl">Цвета</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Палитра в OKLCH. Hex — ориентиры для печати и внешних инструментов.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div
              className="h-28 w-full md:h-36"
              style={{ backgroundImage: "var(--gradient-ember)" }}
              aria-label="Градиент ember"
            />
            <div className="border-t border-border/50 bg-card/40 px-5 py-3 text-sm">
              <span className="font-medium">Gradient Ember</span>
              <span className="ml-2 text-muted-foreground">--gradient-ember · кнопки CTA</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLORS.map((color) => (
              <article
                key={color.token}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/40"
              >
                <div className={`h-24 w-full ${color.swatch}`} />
                <div className="space-y-1 px-4 py-3">
                  <h3 className="font-display text-base">{color.name}</h3>
                  <p className="font-mono text-[11px] text-primary">{color.token}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{color.value}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{color.hex}</p>
                  <p className="pt-1 text-xs text-muted-foreground">{color.usage}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div
              className="h-24 w-full"
              style={{ backgroundImage: "var(--gradient-graphite)" }}
              aria-label="Градиент graphite"
            />
            <div className="border-t border-border/50 bg-card/40 px-5 py-3 text-sm">
              <span className="font-medium">Gradient Graphite</span>
              <span className="ml-2 text-muted-foreground">--gradient-graphite · панели, меню</span>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section id="type" className="space-y-6 scroll-mt-28">
          <div className="space-y-2">
            <h2 className="font-display text-2xl md:text-3xl">Шрифты</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Пара кириллических гарнитур: Onest для заголовков, Golos Text для текста.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-card/40 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Display</p>
              <h3 className="mt-2 font-display text-4xl md:text-5xl">Onest</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                --font-display · 500–800
              </p>
              <div className="mt-6 space-y-4 font-display">
                <p className="text-5xl leading-none tracking-tight md:text-6xl">Аркадий</p>
                <p className="text-3xl leading-tight">Ритм — это язык</p>
                <p className="text-xl text-muted-foreground">Aa Bb Cc · Аа Бб Вв · 0123456789</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Заголовки секций, имя в Hero (до автографа), цифры статистики, marquee.
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border/70 bg-card/40 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Sans</p>
              <h3 className="mt-2 font-sans text-4xl md:text-5xl font-semibold">Golos Text</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">--font-sans · 400–600</p>
              <div className="mt-6 space-y-4 font-sans">
                <p className="text-2xl leading-snug">
                  Профессиональный музыкант с 15-летним опытом.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Студийные записи, концерты с артистами и индивидуальные занятия для тех, кто хочет
                  научиться слышать ритм.
                </p>
                <p className="text-sm text-muted-foreground">Aa Bb Cc · Аа Бб Вв · 0123456789</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Основной текст, описание Hero, карточки, формы админки, кнопки.
                </p>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-border/70 bg-card/40 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Scale</p>
            <div className="mt-5 space-y-5">
              <TypeRow
                label="Display XL"
                sample="АМЕЛИН"
                className="font-display text-5xl md:text-7xl leading-none tracking-tight"
              />
              <TypeRow
                label="Title"
                sample="Три направления — один подход."
                className="font-display text-3xl md:text-5xl leading-tight"
              />
              <TypeRow
                label="Eyebrow"
                sample="ОБО МНЕ"
                className="text-sm uppercase tracking-[0.35em] text-primary"
              />
              <TypeRow
                label="Body"
                sample="Сессионный ударник, концертный музыкант и преподаватель."
                className="text-lg text-muted-foreground"
              />
              <TypeRow
                label="Caption"
                sample="Концертов · Студ. сессий · Учеников"
                className="text-xs uppercase tracking-widest text-muted-foreground"
              />
            </div>
          </article>
        </section>

        <footer className="border-t border-border/60 pt-8 pb-10 text-sm text-muted-foreground">
          <p>
            Внутренняя страница брендбука ·{" "}
            <Link to="/" className="text-primary hover:underline">
              amelindrum
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

function LogoSurface({ tone, children }: { tone: "dark" | "light"; children: ReactNode }) {
  return (
    <div
      className={
        tone === "dark"
          ? "flex min-h-36 items-center justify-center rounded-xl bg-[oklch(0.16_0.018_255)] px-4 py-6"
          : "flex min-h-36 items-center justify-center rounded-xl bg-[oklch(0.96_0.008_255)] px-4 py-6"
      }
    >
      {children}
    </div>
  );
}

function LogoImg({ src, invert }: { src: string; invert?: boolean }) {
  return (
    <img
      src={src}
      alt=""
      className={
        invert ? "max-h-24 w-full object-contain invert" : "max-h-24 w-full object-contain"
      }
    />
  );
}

function Wordmark({ onLight }: { onLight?: boolean }) {
  return (
    <span
      className={
        onLight
          ? "flex items-center gap-2 font-display text-2xl tracking-widest text-[oklch(0.16_0.02_255)]"
          : "flex items-center gap-2 font-display text-2xl tracking-widest text-foreground"
      }
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
      AM#
    </span>
  );
}

function TypeRow({
  label,
  sample,
  className,
}: {
  label: string;
  sample: string;
  className: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border/40 pb-5 last:border-0 last:pb-0 md:grid-cols-[140px_1fr] md:items-end">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={className}>{sample}</div>
    </div>
  );
}
