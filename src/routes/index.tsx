import { createFileRoute } from "@tanstack/react-router";
import { useRef, type MouseEvent } from "react";
import { HeroSignatureLogo } from "@/components/logo/hero-signature-logo";
import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { SocialLinks } from "@/components/social/social-links";
import { SiteNav } from "@/components/site-nav";
import { useSiteContent } from "@/hooks/use-site-content";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { siteContentQueryOptions } from "@/lib/site-content.query";
import { scrollToHash } from "@/lib/scroll-to-hash";
import type { SiteContent } from "@/lib/site-content";

const HERO_IMG = "/media/hero-cover.jpg";
const PORTRAIT_IMG = "/media/portrait.jpg";
const THUMBS = ["/media/video-thumb-1.jpg", "/media/video-thumb-2.jpg", "/media/video-thumb-3.jpg"];

function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function getOgImageUrl() {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return HERO_IMG;
  return `${siteUrl}${HERO_IMG}`;
}

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) => {
    const content = await queryClient.ensureQueryData(siteContentQueryOptions());
    return { content };
  },
  head: () => ({
    meta: [
      { title: "Аркадий Амелин — сессионный барабанщик и преподаватель" },
      {
        name: "description",
        content:
          "Аркадий Амелин — профессиональный музыкант, сессионный ударник и преподаватель. Студийные записи, концерты, уроки игры на барабанах.",
      },
      { property: "og:title", content: "Аркадий Амелин — барабанщик" },
      {
        property: "og:description",
        content:
          "Сессионный ударник, концертный музыкант и преподаватель. Запись барабанов, живые выступления, индивидуальные занятия.",
      },
      { property: "og:image", content: getOgImageUrl() },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ru_RU" },
    ],
  }),
  component: Index,
});

function Index() {
  const { content: loaderContent } = Route.useLoaderData();
  const { content } = useSiteContent(loaderContent);
  const pageRef = useRef<HTMLDivElement>(null);
  useLandingMotion(pageRef);

  return (
    <div ref={pageRef} className="min-h-screen text-foreground overflow-x-hidden">
      <SiteNav socials={content.contact.socials} />
      <Hero c={content} />
      <Marquee items={content.marquee} />
      <About c={content} />
      <Services c={content} />
      <PortfolioSection content={content.portfolio} thumbs={THUMBS} />
      <Experience c={content} />
      <div className="section-band-continue section-band-end">
        <Contact c={content} />
        <Footer />
      </div>
    </div>
  );
}

function Hero({ c }: { c: SiteContent }) {
  return (
    <section id="top" className="relative min-h-dvh overflow-x-clip grain touch-pan-y">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={HERO_IMG}
          alt="Аркадий Амелин за барабанной установкой — вид сверху"
          data-parallax="hero-image"
          data-hero="image"
          className="hero-image h-[108%] w-full object-cover object-[88%_42%] sm:object-[75%_40%] md:object-[center_40%] md:will-change-transform"
          width={1024}
          height={683}
          fetchPriority="high"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/15" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-r from-background/25 via-transparent to-background/10"
          aria-hidden
        />
        <div className="hero-vignette absolute inset-0" aria-hidden />
        <div
          data-hero="sweep"
          className="hero-sweep absolute inset-y-0 -left-1/3 w-1/3 md:will-change-transform"
          aria-hidden
        />
      </div>

      <div
        data-parallax="hero-content"
        className="relative mx-auto flex min-h-dvh max-w-7xl flex-col justify-end px-6 pb-20 pt-28 md:pb-24 md:pt-32 md:will-change-transform touch-pan-y"
      >
        <div data-fade="hero-text" className="hero-copy max-w-5xl">
          <h1 className="hero-title">
            <span className="sr-only">
              {c.hero.name1} {c.hero.name2}
            </span>
            <span className="hero-logo-wrap">
              <HeroSignatureLogo withMotion />
            </span>
          </h1>
          <p
            data-motion="hero-desc"
            className="mt-6 max-w-xl text-lg md:text-xl text-white/95 text-balance whitespace-pre-line leading-relaxed md:mt-8"
          >
            {c.hero.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              data-motion="hero-cta"
              href="#contact"
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                scrollToHash("#contact");
              }}
              className="btn-soft btn-ember rounded-full px-7 py-3.5 font-medium text-primary-foreground shadow-glow"
            >
              {c.hero.ctaPrimary}
            </a>
            <a
              data-motion="hero-cta"
              href="#services"
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                scrollToHash("#services");
              }}
              className="btn-soft rounded-full border border-foreground/40 bg-background/20 px-7 py-3.5 font-medium backdrop-blur-sm hover:border-foreground/55 hover:bg-secondary/80"
            >
              {c.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee({ items }: { items: string[] }) {
  return (
    <div
      data-section="marquee"
      data-parallax="marquee"
      className="marquee-shell border-y border-border/50 bg-card/30 py-3.5 overflow-hidden md:py-4"
    >
      <div className="marquee-track flex gap-10 whitespace-nowrap font-display text-xl tracking-[0.18em] text-muted-foreground/85 md:text-2xl md:tracking-[0.22em]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-12 marquee-loop">
            {items.map((t) => (
              <span key={t + i} className="flex items-center gap-12">
                {t}
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function About({ c }: { c: SiteContent }) {
  const portraitSrc = c.about.imageUrl.trim() || PORTRAIT_IMG;

  return (
    <section id="about" className="section-tight-top relative section-to-band">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-stretch lg:gap-16">
        <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0 lg:max-w-none lg:aspect-auto lg:h-full">
          <div
            data-reveal="portrait"
            className="absolute inset-0 overflow-hidden rounded-2xl border border-border/50 shadow-card"
          >
            <img
              src={portraitSrc}
              alt="Аркадий Амелин с барабанными палочками"
              loading="lazy"
              width={1024}
              height={1536}
              className="h-full w-full object-cover object-[center_28%] scale-[1.04]"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p
            data-reveal="section"
            className="eyebrow text-sm uppercase tracking-[0.35em] text-primary opacity-0"
          >
            {c.about.eyebrow}
          </p>
          <h2
            data-reveal="section"
            className="title-gap font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] opacity-0"
          >
            {c.about.heading}
          </h2>
          <div className="stack-gap text-muted-foreground text-base leading-relaxed md:text-lg">
            {c.about.paragraphs.map((p, i) => (
              <p key={i} data-reveal="section" className="opacity-0">
                {p}
              </p>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border/70 pt-6 sm:gap-4">
            {c.about.stats.map((s, i) => (
              <div key={i} data-reveal="stat" className="opacity-0">
                <div className="font-display text-2xl tabular-nums text-foreground sm:text-3xl md:text-4xl">
                  {s.n}
                </div>
                <div className="mt-1 text-[0.65rem] uppercase leading-snug tracking-[0.14em] text-muted-foreground sm:text-xs sm:tracking-widest">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ c }: { c: SiteContent }) {
  return (
    <section id="services" className="section section-band section-band-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="section-header max-w-2xl">
          <p
            data-reveal="section"
            className="eyebrow text-sm uppercase tracking-[0.35em] text-primary opacity-0"
          >
            {c.services.eyebrow}
          </p>
          <h2
            data-reveal="section"
            className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight opacity-0"
          >
            {c.services.heading}
          </h2>
        </div>
        <div className="services-grid grid gap-5 md:grid-cols-3">
          {c.services.items.map((s) => (
            <article
              key={s.n + s.t}
              data-reveal="card"
              className="service-card group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 opacity-0 shadow-card md:p-7"
            >
              <div className="font-display text-5xl text-primary/55 transition-colors duration-500 group-hover:text-primary md:text-6xl">
                {s.n}
              </div>
              <h3 className="service-card__title mt-4 font-display text-2xl leading-tight md:text-3xl">
                {s.t}
              </h3>
              <p className="mt-3 flex-1 text-muted-foreground leading-relaxed">{s.d}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/80 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experience({ c }: { c: SiteContent }) {
  return (
    <section id="experience" className="section section-band-continue relative">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="section-header max-w-2xl">
          <p
            data-reveal="section"
            className="eyebrow text-sm uppercase tracking-[0.35em] text-primary opacity-0"
          >
            {c.experience.eyebrow}
          </p>
          <h2
            data-reveal="section"
            className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight opacity-0"
          >
            {c.experience.heading}
          </h2>
        </div>
        <ul className="experience-list divide-y divide-border/70 border-y border-border/70">
          {c.experience.items.map((it) => (
            <li
              key={it.y + it.t}
              data-reveal="row"
              className="experience-row group grid grid-cols-1 gap-1.5 px-3 py-5 opacity-0 sm:grid-cols-12 sm:items-baseline sm:gap-x-6 sm:gap-y-2 sm:px-4 md:px-5 md:py-6"
            >
              <div className="experience-year font-display text-2xl leading-none text-primary tabular-nums sm:col-span-2 md:text-3xl">
                {it.y}
              </div>
              <div className="experience-title text-balance text-lg font-medium leading-snug sm:col-span-6 md:text-xl">
                {it.t}
              </div>
              <div className="experience-desc text-pretty text-sm leading-relaxed text-muted-foreground sm:col-span-4 sm:text-right md:text-base">
                {it.d}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Contact({ c }: { c: SiteContent }) {
  return (
    <section id="contact" className="section">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p
          data-reveal="section"
          className="eyebrow text-sm uppercase tracking-[0.35em] text-primary opacity-0"
        >
          {c.contact.eyebrow}
        </p>
        <h2
          data-reveal="section"
          className="title-gap font-display text-4xl md:text-6xl lg:text-7xl leading-tight text-balance opacity-0"
        >
          {c.contact.heading}
        </h2>
        <p
          data-reveal="section"
          className="mx-auto mb-8 max-w-2xl text-muted-foreground text-lg opacity-0"
        >
          {c.contact.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            data-reveal="card"
            href={`mailto:${c.contact.email}`}
            className="btn-soft btn-ember opacity-0 rounded-full px-8 py-4 font-medium text-primary-foreground shadow-glow"
          >
            {c.contact.email}
          </a>
          <a
            data-reveal="card"
            href={`tel:${c.contact.phone.replace(/\s/g, "")}`}
            className="btn-soft opacity-0 rounded-full border border-foreground/40 bg-secondary/40 px-8 py-4 font-medium hover:border-foreground/55 hover:bg-secondary"
          >
            {c.contact.phone}
          </a>
        </div>
        <div className="mt-10 flex justify-center">
          <SocialLinks
            items={c.contact.socials}
            className="justify-center"
            linkClassName="nav-link"
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 pb-8 pt-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row md:gap-4">
        <div className="flex items-center gap-2 font-display tracking-[0.22em]">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          АМЕЛИН · DRUMS
        </div>
        <div className="text-center md:text-right">© {new Date().getFullYear()} Аркадий Амелин</div>
      </div>
    </footer>
  );
}
