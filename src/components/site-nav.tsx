import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { Menu, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { HeroSignatureLogo } from "@/components/logo/hero-signature-logo";
import { SocialLinks } from "@/components/social/social-links";
import { useNavBeat, useNavMotion } from "@/hooks/use-nav-motion";
import type { SiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#about", label: "Обо\u00A0мне" },
  { href: "#services", label: "Услуги" },
  { href: "#portfolio", label: "Портфолио" },
  { href: "#experience", label: "Опыт" },
  { href: "#contact", label: "Контакты" },
] as const;

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
            className="mobile-nav-panel fixed inset-0 z-[60] flex h-[100dvh] w-full flex-col outline-none"
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
                <a
                  href="#top"
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 cursor-pointer"
                >
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

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center overflow-y-auto px-6 pb-10 pt-2">
              <a
                href="#top"
                onClick={() => onOpenChange(false)}
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
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => onOpenChange(false)}
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
                      {link.label}
                    </span>
                  </a>
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

export function SiteNav({ socials = [] }: { socials?: SiteContent["contact"]["socials"] }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const beatRef = useRef<HTMLSpanElement | null>(null);
  useNavMotion(headerRef);
  useNavBeat(beatRef);

  return (
    <header ref={headerRef} className="site-nav fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <a href="#top" className="shrink-0 cursor-pointer">
          <BrandMark beatRef={beatRef} />
        </a>

        <div className="flex h-8 items-center justify-end gap-8">
          <nav
            className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
            aria-label="Основная навигация"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link cursor-pointer text-foreground/70 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <MobileNavMenu open={open} onOpenChange={setOpen} socials={socials} />
        </div>
      </div>
    </header>
  );
}
