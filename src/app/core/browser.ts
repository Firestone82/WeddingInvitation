/** Reads the recipient from `?to=Janu%20a%20Petra` so every guest can get a personal link. */
export function recipientFromUrl(): string | null {
  const value = new URLSearchParams(window.location.search).get('to')?.trim();
  return value ? value.slice(0, 60) : null;
}

/** The guest asked their system for less motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
