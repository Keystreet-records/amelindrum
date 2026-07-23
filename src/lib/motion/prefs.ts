export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Touch / coarse-pointer devices — avoid scroll-scrub under the finger (Safari). */
export function prefersTouchScroll() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window
  );
}

export { EASE_OUT, EASE_IN_OUT, EASE_DRAWER, MOTION } from "@/lib/motion/tokens";
