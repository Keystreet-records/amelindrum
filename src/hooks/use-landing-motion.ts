import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion, prefersTouchScroll } from "@/lib/motion/prefs";
import { MOTION } from "@/lib/motion/tokens";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HERO_MOTION = "[data-motion='hero-name'], [data-motion='hero-desc'], [data-motion='hero-cta']";
const SECTION_REVEALS =
  "[data-reveal='section'], [data-reveal='card'], [data-reveal='row'], [data-reveal='stat'], [data-reveal='portrait']";

function clearHtmlFailsafe() {
  document.documentElement.classList.remove("motion-failsafe");
}

function forceVisible(root: HTMLElement) {
  gsap.set(root.querySelectorAll("[data-motion], [data-reveal]"), {
    autoAlpha: 1,
    y: 0,
    x: 0,
    scale: 1,
    clearProps: "transform",
  });
  gsap.set(root.querySelectorAll("[data-hero='image']"), { scale: 1, clearProps: "transform" });
  gsap.set(root.querySelectorAll("[data-hero='veil']"), { autoAlpha: 0 });
  root.dataset.motionBoot = "done";
  clearHtmlFailsafe();
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
      }, MOTION.failsafeMs);

      const markDone = () => {
        introDone = true;
        window.clearTimeout(failSafe);
        root.dataset.motionBoot = "done";
        clearHtmlFailsafe();
        // Late images/fonts can shift section tops — re-measure once after intro.
        ScrollTrigger.refresh();
      };

      const ctx = gsap.context(() => {
        gsap.set(HERO_MOTION, { autoAlpha: 0, y: MOTION.intro.textY });
        gsap.set(SECTION_REVEALS, { autoAlpha: 0 });
        gsap.set("[data-reveal='portrait']", { y: MOTION.reveal.portraitY });
        gsap.set("[data-hero='image']", { scale: MOTION.intro.imageScale });
        gsap.set("[data-hero='veil']", { autoAlpha: 0.4 });

        root.dataset.motionBoot = "ready";

        const intro = gsap.timeline({
          defaults: { ease: MOTION.ease.out },
          onComplete: markDone,
        });

        intro
          .to(
            "[data-hero='image']",
            { scale: 1, duration: MOTION.dur.hero, ease: MOTION.ease.out },
            0,
          )
          .to("[data-hero='veil']", { autoAlpha: 0, duration: MOTION.dur.enter }, 0)
          .to(
            "[data-motion='hero-name']",
            { autoAlpha: 1, y: 0, duration: MOTION.dur.enter },
            MOTION.intro.nameAt,
          )
          .to(
            "[data-motion='hero-desc']",
            { autoAlpha: 1, y: 0, duration: MOTION.dur.enter },
            MOTION.intro.descAt,
          )
          .to(
            "[data-motion='hero-cta']",
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.dur.base,
              stagger: MOTION.stagger.base,
            },
            MOTION.intro.ctaAt,
          );

        // Desktop only: parallax on wrappers (intro scale stays on the <img>).
        if (!touchScroll) {
          gsap.to("[data-parallax='hero-image']", {
            y: MOTION.parallax.heroImageY,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "bottom top",
              scrub: MOTION.scrub,
            },
          });

          gsap.to("[data-parallax='hero-content']", {
            y: MOTION.parallax.heroContentY,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "65% top",
              scrub: MOTION.scrub,
            },
          });

          gsap.to("[data-fade='hero-text']", {
            autoAlpha: 0,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "65% top",
              scrub: MOTION.scrub,
            },
          });

          gsap.to("[data-parallax='marquee']", {
            opacity: MOTION.parallax.marqueeOpacity,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "[data-section='marquee']",
              start: "top bottom",
              end: "bottom top",
              scrub: MOTION.scrub,
            },
          });
        }

        const revealBatch = (
          selector: string,
          from: gsap.TweenVars,
          duration: number,
          stagger: number,
          start: string = MOTION.reveal.start,
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
                ease: MOTION.ease.out,
                overwrite: "auto",
              });
            },
          });
        };

        revealBatch(
          "[data-reveal='section']",
          { y: MOTION.reveal.sectionY, autoAlpha: 0 },
          MOTION.dur.enter,
          MOTION.stagger.base,
        );
        revealBatch(
          "[data-reveal='card']",
          { y: MOTION.reveal.cardY, autoAlpha: 0 },
          MOTION.dur.enter,
          MOTION.stagger.loose,
        );
        revealBatch(
          "[data-reveal='row']",
          { x: MOTION.reveal.rowX, autoAlpha: 0 },
          MOTION.dur.base,
          MOTION.stagger.tight,
        );
        revealBatch(
          "[data-reveal='stat']",
          { y: MOTION.reveal.statY, autoAlpha: 0 },
          MOTION.dur.base,
          MOTION.stagger.base,
        );
        revealBatch(
          "[data-reveal='portrait']",
          { y: MOTION.reveal.portraitY, autoAlpha: 0 },
          MOTION.dur.hero,
          0,
          MOTION.reveal.portraitStart,
        );
      }, root);

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad, { once: true });
      if (document.fonts?.ready) {
        void document.fonts.ready.then(() => {
          if (root.isConnected) ScrollTrigger.refresh();
        });
      }

      return () => {
        window.clearTimeout(failSafe);
        window.removeEventListener("load", onLoad);
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
    gsap.set(panel, { autoAlpha: 0, y: 18, scale: 0.985 });
    gsap
      .timeline({ onComplete })
      .to(overlay, {
        autoAlpha: 1,
        duration: MOTION.dur.fast,
        ease: MOTION.ease.out,
      })
      .to(
        panel,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: MOTION.dur.modalIn,
          ease: MOTION.ease.modal,
        },
        "-=0.16",
      );
    return;
  }

  gsap
    .timeline({ onComplete })
    .to(panel, {
      autoAlpha: 0,
      y: 10,
      scale: 0.985,
      duration: MOTION.dur.modalOut,
      ease: MOTION.ease.in,
    })
    .to(
      overlay,
      {
        autoAlpha: 0,
        duration: MOTION.dur.modalOut,
        ease: MOTION.ease.in,
      },
      "-=0.08",
    );
}
