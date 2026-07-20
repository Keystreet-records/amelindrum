import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion/prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-motion], [data-reveal]", {
          clearProps: "all",
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
        });
        gsap.set("[data-hero='image']", { clearProps: "all" });
        return;
      }

      const ctx = gsap.context(() => {
        gsap.set("[data-motion='hero-name'], [data-motion='hero-desc'], [data-motion='hero-cta']", {
          opacity: 0,
        });

        gsap.set("[data-reveal='portrait']", { opacity: 0, scale: 1.04 });
        gsap.set("[data-hero='image']", {
          scale: 1.12,
          filter: "brightness(0.55) contrast(1.05)",
          transformOrigin: window.matchMedia("(min-width: 768px)").matches ? "50% 40%" : "88% 42%",
        });
        gsap.set("[data-hero='sweep']", { xPercent: -20, opacity: 0 });

        const intro = gsap.timeline({
          defaults: { ease: "power3.out", duration: 1 },
          delay: 0.08,
        });

        intro
          .to(
            "[data-hero='image']",
            {
              scale: 1,
              filter: "brightness(1) contrast(1)",
              duration: 1.55,
              ease: "power2.out",
            },
            0,
          )
          .fromTo(
            "[data-hero='sweep']",
            { xPercent: -30, opacity: 0 },
            { xPercent: 380, opacity: 1, duration: 1.15, ease: "power1.inOut" },
            0.12,
          )
          .to("[data-hero='sweep']", { opacity: 0, duration: 0.35 }, "-=0.35")
          .fromTo(
            "[data-motion='hero-name']",
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.05 },
            "-=0.75",
          )
          .fromTo(
            "[data-motion='hero-desc']",
            { y: 26, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.95 },
            "-=0.7",
          )
          .fromTo(
            "[data-motion='hero-cta']",
            { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.85, stagger: 0.1 },
            "-=0.6",
          );

        gsap.to("[data-parallax='hero-image']", {
          y: 140,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 0.75,
          },
        });

        gsap.to("[data-parallax='hero-content']", {
          y: -48,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "65% top",
            scrub: 0.45,
          },
        });

        gsap.to("[data-fade='hero-text']", {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "65% top",
            scrub: 0.45,
          },
        });

        ScrollTrigger.batch("[data-reveal='section']", {
          start: "top 88%",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { y: 44, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.09,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          },
        });

        ScrollTrigger.batch("[data-reveal='card']", {
          start: "top 91%",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { y: 52, opacity: 0, scale: 0.985 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.95,
                stagger: 0.13,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          },
        });

        ScrollTrigger.batch("[data-reveal='row']", {
          start: "top 93%",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { x: -20, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.07,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          },
        });

        ScrollTrigger.batch("[data-reveal='stat']", {
          start: "top 92%",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.1,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          },
        });

        ScrollTrigger.batch("[data-reveal='portrait']", {
          start: "top bottom",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { scale: 1.04, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 1.1,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          },
        });

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

        ScrollTrigger.refresh();
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef },
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
    gsap.set(overlay, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: 28, scale: 0.97 });
    gsap
      .timeline({ onComplete })
      .to(overlay, { opacity: 1, duration: 0.35, ease: "power2.out" })
      .to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, "-=0.2");
    return;
  }

  gsap
    .timeline({ onComplete })
    .to(panel, { opacity: 0, y: 16, scale: 0.98, duration: 0.28, ease: "power2.in" })
    .to(overlay, { opacity: 0, duration: 0.25, ease: "power2.in" }, "-=0.12");
}
