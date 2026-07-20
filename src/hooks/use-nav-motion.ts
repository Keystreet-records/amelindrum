import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion/prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function setNavAlpha(header: HTMLElement, alpha: number) {
  header.style.setProperty("--nav-alpha", String(Math.min(1, Math.max(0, alpha))));
}

export function useNavMotion(headerRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      if (prefersReducedMotion()) {
        setNavAlpha(header, 1);
        return;
      }

      const update = () => {
        const vh = window.innerHeight || 1;
        const scrollY = window.scrollY || 0;
        const fadeStart = vh * 0.2;
        const fadeEnd = vh * 0.65;
        const progress = Math.min(1, Math.max(0, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
        setNavAlpha(header, progress);
      };

      const trigger = ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: update,
        onRefresh: update,
      });

      update();

      return () => {
        trigger.kill();
      };
    },
    { scope: headerRef },
  );
}

export function useNavBeat(dotRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (prefersReducedMotion() || !dotRef.current) return;
      gsap.to(dotRef.current, {
        scale: 1.12,
        opacity: 1,
        duration: 0.9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: dotRef },
  );
}
