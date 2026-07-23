/** Shared motion language — tuned to the cinematic landing feel. */

export const MOTION = {
  /**
   * Must finish AFTER hero intro (~1.1s). Too short → forceVisible kills mid-tween.
   * Keep in sync with __root.tsx inline script.
   */
  failsafeMs: 2200,

  dur: {
    instant: 0.2,
    fast: 0.3,
    base: 0.55,
    enter: 0.7,
    hero: 0.95,
    modalIn: 0.45,
    modalOut: 0.24,
  },

  stagger: {
    tight: 0.05,
    base: 0.07,
    loose: 0.09,
  },

  ease: {
    out: "power2.out",
    in: "power2.in",
    modal: "power3.out",
    beat: "sine.inOut",
    scrub: "none",
  },

  /** Soft lag on desktop scrub — closer to original 0.4–0.6 feel */
  scrub: {
    image: 0.6,
    content: 0.45,
    fade: 0.45,
    marquee: true as const,
  },

  reveal: {
    sectionStart: "top 88%",
    cardStart: "top 91%",
    rowStart: "top 93%",
    statStart: "top 92%",
    portraitStart: "top bottom",
    sectionY: 28,
    cardY: 32,
    cardScale: 0.99,
    rowX: -14,
    statY: 14,
    portraitScale: 1.03,
  },

  intro: {
    imageScale: 1.06,
    textY: 20,
    nameAt: 0.18,
    descAt: 0.3,
    ctaAt: 0.42,
    veil: 0.4,
  },

  parallax: {
    heroImageY: 120,
    heroContentY: -40,
    marqueeOpacity: 0.55,
  },
} as const;

export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
