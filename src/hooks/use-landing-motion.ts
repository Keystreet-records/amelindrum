import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion, prefersTouchScroll } from "@/lib/motion/prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HERO_MOTION = "[data-motion='hero-name'], [data-motion='hero-desc'], [data-motion='hero-cta']";
const SECTION_REVEALS =
  "[data-reveal='section'], [data-reveal='card'], [data-reveal='row'], [data-reveal='stat'], [data-reveal='portrait']";

function forceVisible(root: HTMLElement) {
  gsap.set(root.querySelectorAll("[data-motion], [data-reveal]"), {
    autoAlpha: 1,
    y: 0,
    x: 0,
    scale: 1,
  });
  gsap.set(root.querySelectorAll("[data-hero='image']"), { scale: 1 });
  gsap.set(root.querySelectorAll("[data-hero='veil']"), { autoAlpha: 0 });
  gsap.set(root.querySelectorAll("[data-hero='sweep']"), { autoAlpha: 0 });
  root.dataset.motionBoot = "done";
}

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      root.dataset.motionBoot = "pending";

      if (prefersReducedMotion()) {
        forceVisible(root);
        return;
      }

      const touchScroll = prefersTouchScroll();
      let introDone = false;

      const failSafe = window.setTimeout(() => {
        if (!introDone) forceVisible(root);
      }, 3500);

      const markDone = () => {
        introDone = true;
        window.clearTimeout(failSafe);
        root.dataset.motionBoot = "done";
      };

      const ctx = gsap.context(() => {
        gsap.set(HERO_MOTION, { autoAlpha: 0, y: 20 });
        gsap.set(SECTION_REVEALS, { autoAlpha: 0 });
        gsap.set("[data-reveal='portrait']", { scale: 1.03 });
        gsap.set("[data-hero='image']", { scale: 1.06 });
        gsap.set("[data-hero='veil']", { autoAlpha: 0.4 });
        gsap.set("[data-hero='sweep']", { autoAlpha: 0 });

        root.dataset.motionBoot = "ready";

        // Keep intro on transform/opacity only — no filter, no blend thrash.
        const intro = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: markDone,
        });

        intro
          .to("[data-hero='image']", { scale: 1, duration: 0.95, ease: "power2.out" }, 0)
          .to("[data-hero='veil']", { autoAlpha: 0, duration: 0.85 }, 0)
          .to(
            "[data-motion='hero-name']",
            { autoAlpha: 1, y: 0, duration: 0.7 },
            0.18,
          )
          .to(
            "[data-motion='hero-desc']",
            { autoAlpha: 1, y: 0, duration: 0.65 },
            0.3,
          )
          .to(
            "[data-motion='hero-cta']",
            { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07 },
            0.42,
          );

        if (!touchScroll) {
          gsap.to("[data-parallax='hero-image']", {
            y: 120,
            ease: "none",
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });

          gsap.to("[data-parallax='hero-content']", {
            y: -40,
            ease: "none",
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "65% top",
              scrub: 0.4,
            },
          });
        }

        gsap.to("[data-fade='hero-text']", {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "65% top",
            scrub: touchScroll ? true : 0.4,
          },
        });

        const revealBatch = (
          selector: string,
          from: gsap.TweenVars,
          duration: number,
          stagger: number,
          start = "top 90%",
        ) => {
          ScrollTrigger.batch(selector, {
            start,
            once: true,
            onEnter: (elements) => {
              gsap.fromTo(elements, from, {
                autoAlpha: 1,
                y: 0,
                x: 0,
                scale: 1,
                duration,
                stagger,
                ease: "power2.out",
                overwrite: "auto",
              });
            },
          });
        };

        revealBatch("[data-reveal='section']", { y: 28, autoAlpha: 0 }, 0.7, 0.07, "top 88%");
        revealBatch(
          "[data-reveal='card']",
          { y: 32, autoAlpha: 0, scale: 0.99 },
          0.7,
          0.09,
          "top 91%",
        );
        revealBatch("[data-reveal='row']", { x: -14, autoAlpha: 0 }, 0.6, 0.05, "top 93%");
        revealBatch("[data-reveal='stat']", { y: 14, autoAlpha: 0 }, 0.55, 0.07, "top 92%");
        revealBatch(
          "[data-reveal='portrait']",
          { scale: 1.03, autoAlpha: 0 },
          0.85,
          0,
          "top bottom",
        );

        gsap.to("[data-parallax='marquee']", {
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-section='marquee']",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }, root);

      return () => {
        window.clearTimeout(failSafe);
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
