/** Shared motion language for GSAP + CSS alignment. */

export const MOTION = {
  /** Failsafe clock (ms) — keep in sync with __root.tsx inline script */
  failsafeMs: 800,

  dur: {
    instant: 0.2,
    fast: 0.35,
    base: 0.55,
    enter: 0.7,
    hero: 0.9,
    modalIn: 0.4,
    modalOut: 0.22,
  },

  stagger: {
    tight: 0.05,
    base: 0.07,
    loose: 0.1,
  },

  /** GSAP easing names */
  ease: {
    out: "power2.out",
    in: "power2.in",
    modal: "power2.out",
    beat: "sine.inOut",
    scrub: "none",
  },

  /** ScrollTrigger scrub lag (seconds). One soft value site-wide. */
  scrub: 0.5,

  reveal: {
    start: "top 90%",
    portraitStart: "top 95%",
    /** Entrance offsets — short travel feels smoother than big slides */
    sectionY: 18,
    cardY: 20,
    rowX: -10,
    statY: 12,
    portraitY: 16,
  },

  intro: {
    imageScale: 1.05,
    textY: 16,
    nameAt: 0.16,
    descAt: 0.28,
    ctaAt: 0.4,
  },

  parallax: {
    heroImageY: 96,
    heroContentY: -32,
    marqueeOpacity: 0.6,
  },
} as const;

/** CSS cubic-bezier mirrors (keep in sync with styles.css --ease-*) */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
