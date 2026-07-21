import { prefersReducedMotion, prefersTouchScroll } from "@/lib/motion/prefs";

/** Instant scroll on touch (Safari hash + smooth fights finger pans). */
export function scrollToHash(hash: string, options?: { behavior?: ScrollBehavior }) {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const behavior =
    options?.behavior ?? (prefersReducedMotion() || prefersTouchScroll() ? "auto" : "smooth");

  if (id === "top") {
    window.scrollTo({ top: 0, left: 0, behavior });
    if (typeof history !== "undefined" && history.replaceState) {
      history.replaceState(null, "", `#${id}`);
    }
    return;
  }

  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({ behavior, block: "start" });
  if (typeof history !== "undefined" && history.replaceState) {
    history.replaceState(null, "", `#${id}`);
  }
}
