/** Remove a trailing sentence period (…/!/? stay). */
export function stripTrailingPeriod(text: string): string {
  return text.replace(/\.(?=\s*$)/u, "");
}

/**
 * Russian hanging particles: short prepositions/conjunctions that must not
 * sit alone at the end of a line. Bound to the next word with NBSP.
 * Longer tokens first so «через» wins over «че».
 */
const HANGING_TOKENS = [
  "через",
  "между",
  "перед",
  "около",
  "после",
  "возле",
  "сверх",
  "среди",
  "ради",
  "против",
  "вместо",
  "внутри",
  "вокруг",
  "согласно",
  "благодаря",
  "несмотря",
  "либо",
  "или",
  "над",
  "под",
  "при",
  "про",
  "без",
  "для",
  "из",
  "от",
  "до",
  "по",
  "за",
  "со",
  "ко",
  "во",
  "об",
  "обо",
  "не",
  "ни",
  "но",
  "да",
  "то",
  "же",
  "ли",
  "бы",
  "а",
  "и",
  "в",
  "к",
  "с",
  "у",
  "о",
  "на",
] as const;

const HANGING_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${HANGING_TOKENS.join("|")})\\s+(?=\\S)`,
  "giu",
);

/** Bind hanging Russian prepositions/conjunctions to the following word. */
export function bindHangingPrepositions(text: string): string {
  return text.replace(HANGING_PATTERN, (_match, token: string) => `${token}\u00A0`);
}

/** @deprecated Use bindHangingPrepositions — kept for call-site compatibility. */
export function bindConjunctionI(text: string): string {
  return bindHangingPrepositions(text);
}

/** Titles: no trailing period + hanging particles bound. */
export function polishTitle(text: string): string {
  return bindHangingPrepositions(stripTrailingPeriod(text.trim()));
}

/** Body copy: last sentence without a period + hanging particles bound. */
export function polishBody(text: string): string {
  return bindHangingPrepositions(stripTrailingPeriod(text.trim()));
}

/** Short UI labels / eyebrows / CTAs (no period stripping needed usually). */
export function polishLabel(text: string): string {
  return bindHangingPrepositions(text.trim());
}
