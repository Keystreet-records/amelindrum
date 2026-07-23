import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion, prefersTouchScroll } from "@/lib/motion/prefs";
import { MOTION } from "@/lib/motion/tokens";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HERO_MOTION = "[data-motion='hero-name'], [data-motion='hero-desc'], [data-motion='hero-cta']";

function clearHtmlFailsafe() {
  document.documentElement.classList.remove("motion-failsafe");
}

function forceVisible(root: HTMLElement) {
  gsap.set(root.querySelectorAll("[data-motion], [data-reveal]"), {
    autoAlpha: 1,
    y: 0,
    x: 0,
    scale: 1,
  });
  gsap.set(root.querySelectorAll("[data-hero='image']"), { scale: 1 });
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
        ScrollTrigger.refresh();
      };

      let ctx: gsap.Context;
      try {
        ctx = gsap.context(() => {
          // Hero gate only — section reveals are hidden via GSAP after JS is alive
          // (never via CSS, so a slow/failed boot can't blank the whole page).
          gsap.set(HERO_MOTION, { autoAlpha: 0, y: MOTION.intro.textY });
          gsap.set("[data-hero='image']", { scale: MOTION.intro.imageScale });
          gsap.set("[data-hero='veil']", { autoAlpha: MOTION.intro.veil });

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
            .to("[data-hero='veil']", { autoAlpha: 0, duration: 0.85 }, 0)
            .to(
              "[data-motion='hero-name']",
              { autoAlpha: 1, y: 0, duration: MOTION.dur.enter },
              MOTION.intro.nameAt,
            )
            .to(
              "[data-motion='hero-desc']",
              { autoAlpha: 1, y: 0, duration: 0.65 },
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

          // Transform parallax: desktop only (Safari touch + scrub y feels sticky).
          if (!touchScroll) {
            gsap.to("[data-parallax='hero-image']", {
              y: MOTION.parallax.heroImageY,
              ease: MOTION.ease.scrub,
              scrollTrigger: {
                trigger: "#top",
                start: "top top",
                end: "bottom top",
                scrub: MOTION.scrub.image,
              },
            });

            gsap.to("[data-parallax='hero-content']", {
              y: MOTION.parallax.heroContentY,
              ease: MOTION.ease.scrub,
              scrollTrigger: {
                trigger: "#top",
                start: "top top",
                end: "65% top",
                scrub: MOTION.scrub.content,
              },
            });
          }

          // Opacity fade is fine on touch — keeps hero cinematic without transform thrash.
          gsap.to("[data-fade='hero-text']", {
            autoAlpha: 0,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "65% top",
              scrub: touchScroll ? true : MOTION.scrub.fade,
            },
          });

          gsap.to("[data-parallax='marquee']", {
            opacity: MOTION.parallax.marqueeOpacity,
            ease: MOTION.ease.scrub,
            scrollTrigger: {
              trigger: "[data-section='marquee']",
              start: "top bottom",
              end: "bottom top",
              scrub: MOTION.scrub.marquee,
            },
          });

          const revealBatch = (
            selector: string,
            from: gsap.TweenVars,
            duration: number,
            stagger: number,
            start: string,
          ) => {
            const nodes = gsap.utils.toArray<HTMLElement>(selector);
            if (!nodes.length) return;

            // Hide only once GSAP is running — SSR stays visible if this never runs.
            gsap.set(nodes, from);

            ScrollTrigger.batch(nodes, {
              start,
              once: true,
              onEnter: (elements) => {
                gsap.to(elements, {
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
            MOTION.reveal.sectionStart,
          );
          revealBatch(
            "[data-reveal='card']",
            {
              y: MOTION.reveal.cardY,
              autoAlpha: 0,
              scale: MOTION.reveal.cardScale,
            },
            MOTION.dur.enter,
            MOTION.stagger.loose,
            MOTION.reveal.cardStart,
          );
          revealBatch(
            "[data-reveal='row']",
            { x: MOTION.reveal.rowX, autoAlpha: 0 },
            0.6,
            MOTION.stagger.tight,
            MOTION.reveal.rowStart,
          );
          revealBatch(
            "[data-reveal='stat']",
            { y: MOTION.reveal.statY, autoAlpha: 0 },
            MOTION.dur.base,
            MOTION.stagger.base,
            MOTION.reveal.statStart,
          );
          revealBatch(
            "[data-reveal='portrait']",
            {
              scale: MOTION.reveal.portraitScale,
              autoAlpha: 0,
            },
            0.85,
            0,
            MOTION.reveal.portraitStart,
          );
        }, root);
      } catch (err) {
        console.error("[motion] boot failed", err);
        forceVisible(root);
        return;
      }

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
    gsap.set(panel, { autoAlpha: 0, y: 24, scale: 0.98 });
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
        "-=0.18",
      );
    return;
  }

  gsap
    .timeline({ onComplete })
    .to(panel, {
      autoAlpha: 0,
      y: 14,
      scale: 0.98,
      duration: MOTION.dur.modalOut,
      ease: MOTION.ease.in,
    })
    .to(
      overlay,
      {
        autoAlpha: 0,
        duration: 0.22,
        ease: MOTION.ease.in,
      },
      "-=0.1",
    );
}
