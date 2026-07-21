export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Touch / coarse-pointer devices — avoid scroll-scrub transforms under the finger (Safari). */
export function prefersTouchScroll() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window
  );
}

/** Strong ease-out — entrances feel responsive but soft */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Smooth on-screen movement */
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

/** Drawer / overlay curves */
export const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
