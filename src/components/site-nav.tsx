import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { Menu, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { HeroSignatureLogo } from "@/components/logo/hero-signature-logo";
import { SocialLinks } from "@/components/social/social-links";
import { useNavBeat, useNavMotion } from "@/hooks/use-nav-motion";
import { scrollToHash } from "@/lib/scroll-to-hash";
import type { SiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#about", label: "Обо\u00A0мне" },
  { href: "#services", label: "Услуги" },
  { href: "#portfolio", label: "Портфолио" },
  { href: "#experience", label: "Опыт" },
  { href: "#contact", label: "Контакты" },
] as const;

/** Ignore click if the pointer moved — otherwise Safari treats a scroll-start on the link as navigation. */
function useTapLink(onNavigate?: () => void) {
  const origin = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event: PointerEvent) => {
      origin.current = { x: event.clientX, y: event.clientY };
    },
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const start = origin.current;
      origin.current = null;
      if (start) {
        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (dx > 14 || dy > 14) {
          event.preventDefault();
          return;
        }
      }

      event.preventDefault();
      scrollToHash(href);
      onNavigate?.();
    },
  };
}

function BrandMark({
  beatRef,
  className,
}: {
  beatRef?: RefObject<HTMLSpanElement | null>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "nav-logo flex h-8 items-center gap-2 font-display text-xl leading-none tracking-widest",
        className,
      )}
    >
      <span ref={beatRef} className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
      AM#
    </span>
  );
}

function MobileNavMenu({
  open,
  onOpenChange,
  socials,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socials: SiteContent["contact"]["socials"];
}) {
  const brandTap = useTapLink(() => onOpenChange(false));
  const signatureTap = useTapLink(() => onOpenChange(false));

  // Keep Safari chrome / overscroll the same navy as the menu (not the lighter page field).
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevHtmlBg = root.style.backgroundColor;
    const prevTheme = meta?.getAttribute("content");

    root.style.backgroundColor = "#0a0e18";
    meta?.setAttribute("content", "#0a0e18");

    return () => {
      root.style.backgroundColor = prevHtmlBg;
      if (meta) {
        if (prevTheme == null) meta.removeAttribute("content");
        else meta.setAttribute("content", prevTheme);
      }
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="btn-soft inline-flex size-8 cursor-pointer items-center justify-center text-foreground md:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        {open ? (
          <DialogPrimitive.Content
            className="mobile-nav-panel fixed inset-0 z-[60] flex w-full flex-col outline-none"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement)
                .querySelector<HTMLElement>("[data-mobile-close]")
                ?.focus();
            }}
          >
            <div className="mobile-nav-chrome mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
              <DialogPrimitive.Title asChild>
                <a href="#top" {...brandTap} className="shrink-0 cursor-pointer">
                  <BrandMark />
                </a>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  data-mobile-close
                  className="btn-soft inline-flex size-8 shrink-0 cursor-pointer items-center justify-center text-foreground opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100"
                  aria-label="Закрыть меню"
                >
                  <X className="size-5" strokeWidth={2} />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2">
              <a
                href="#top"
                {...signatureTap}
                className="mobile-nav-signature group mb-8 block w-[min(100%,18.5rem)] cursor-pointer sm:mb-10 sm:w-[min(100%,22rem)]"
                aria-label="Аркадий Амелин — наверх"
              >
                <span className="mobile-nav-signature-inner block">
                  <HeroSignatureLogo className="mobile-nav-signature-logo" />
                </span>
                <span className="mobile-nav-signature-rule mt-5 block h-px w-12 origin-left bg-primary/70" />
              </a>

              <nav className="flex flex-col" aria-label="Мобильная навигация">
                {LINKS.map((link, index) => (
                  <MobileNavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    index={index}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </nav>

              <SocialLinks
                items={socials}
                animated
                animationBaseDelayMs={220 + LINKS.length * 55 + 40}
                onNavigate={() => onOpenChange(false)}
                className="mobile-nav-socials mt-8 gap-x-6 gap-y-3.5"
                linkClassName="text-[0.95rem]"
                iconClassName="size-[1.05rem]"
              />
            </div>
          </DialogPrimitive.Content>
        ) : null}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MobileNavLink({
  href,
  label,
  index,
  onNavigate,
}: {
  href: string;
  label: string;
  index: number;
  onNavigate: () => void;
}) {
  const tap = useTapLink(onNavigate);
  return (
    <a
      href={href}
      {...tap}
      className="mobile-nav-link group relative block border-b border-border/40 py-4 font-display text-[clamp(2rem,8vw,3.25rem)] leading-none tracking-tight text-foreground transition-colors duration-300 hover:text-primary"
      style={
        {
          transitionTimingFunction: "var(--ease-out)",
          "--mobile-nav-delay": `${220 + index * 55}ms`,
        } as CSSProperties
      }
    >
      <span className="mobile-nav-link-inner">
        <span className="mr-3 font-sans text-xs font-medium tracking-[0.2em] text-muted-foreground transition-colors duration-300 group-hover:text-primary/80">
          {String(index + 1).padStart(2, "0")}
        </span>
        {label}
      </span>
    </a>
  );
}

export function SiteNav({ socials = [] }: { socials?: SiteContent["contact"]["socials"] }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const beatRef = useRef<HTMLSpanElement | null>(null);
  const brandTap = useTapLink();
  useNavMotion(headerRef);
  useNavBeat(beatRef);

  return (
    <header ref={headerRef} className="site-nav fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <a href="#top" {...brandTap} className="shrink-0 cursor-pointer">
          <BrandMark beatRef={beatRef} />
        </a>

        <div className="flex h-8 items-center justify-end gap-8">
          <nav
            className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
            aria-label="Основная навигация"
          >
            {LINKS.map((link) => (
              <DesktopNavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <MobileNavMenu open={open} onOpenChange={setOpen} socials={socials} />
        </div>
      </div>
    </header>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const tap = useTapLink();
  return (
    <a href={href} {...tap} className="nav-link cursor-pointer text-foreground/70 hover:text-foreground">
      {label}
    </a>
  );
}
