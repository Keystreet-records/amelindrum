import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion, prefersTouchScroll } from "@/lib/motion/prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Light motion only — never hide page content waiting for JS. */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      root.dataset.motionBoot = "done";

      if (prefersReducedMotion()) return;

      const touchScroll = prefersTouchScroll();

      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-hero='image']",
          { scale: 1.06 },
          { scale: 1, duration: 0.9, ease: "power2.out" },
        );
        gsap.fromTo(
          "[data-hero='veil']",
          { autoAlpha: 0.35 },
          { autoAlpha: 0, duration: 0.8, ease: "power2.out" },
        );

        if (!touchScroll) {
          gsap.to("[data-parallax='hero-image']", {
            y: 80,
            ease: "none",
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        }
      }, root);

      return () => {
        ctx.revert();
        delete root.dataset.motionBoot;
      };
    },
    { scope: rootRef, dependencies: [] },
  );
}

export function animateVideoModal(
  overlay: HTMLElement,
  panel: HTMLElement,
  direction: "in" | "out",
  onComplete?: () => void,
) {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }

  if (direction === "in") {
    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(panel, { autoAlpha: 0, y: 24, scale: 0.98 });
    gsap
      .timeline({ onComplete })
      .to(overlay, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
      .to(panel, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, "-=0.18");
    return;
  }

  gsap
    .timeline({ onComplete })
    .to(panel, { autoAlpha: 0, y: 14, scale: 0.98, duration: 0.24, ease: "power2.in" })
    .to(overlay, { autoAlpha: 0, duration: 0.22, ease: "power2.in" }, "-=0.1");
}
