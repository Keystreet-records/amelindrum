/** Remove a trailing sentence period (…/!/? stay). */
export function stripTrailingPeriod(text: string): string {
  return text.replace(/\.(?=\s*$)/u, "");
}

/**
 * Keep the conjunction «и» with the following word (nbsp),
 * so it wraps to the next line instead of hanging at the end.
 */
export function bindConjunctionI(text: string): string {
  return text.replace(/(?<![\p{L}\p{N}_])и\s+/giu, "и\u00A0");
}

/** Titles: no trailing period + «и» bound to the next word. */
export function polishTitle(text: string): string {
  return bindConjunctionI(stripTrailingPeriod(text.trim()));
}

/** Body copy: last sentence without a period + «и» bound to the next word. */
export function polishBody(text: string): string {
  return bindConjunctionI(stripTrailingPeriod(text.trim()));
}
