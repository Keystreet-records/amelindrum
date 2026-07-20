import sweepLogo from "@/assets/logo/amelin-logo-sweep-hero.svg?url";
import { cn } from "@/lib/utils";

type HeroSignatureLogoProps = {
  className?: string;
  /** Marks the mark for the hero GSAP intro */
  withMotion?: boolean;
};

export function HeroSignatureLogo({ className, withMotion = false }: HeroSignatureLogoProps) {
  return (
    <img
      {...(withMotion ? { "data-motion": "hero-name" as const } : {})}
      src={sweepLogo}
      alt=""
      width={1480}
      height={610}
      className={cn("hero-logo", className)}
      decoding="async"
      draggable={false}
    />
  );
}
