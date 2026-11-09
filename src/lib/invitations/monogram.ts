const initial = (s: string) => Array.from(s.trim())[0]?.toUpperCase() ?? "";

/** "Anna", "David" → "A&D"; a single host → "M". Works for Armenian and Cyrillic. */
export function monogram(one: string, two: string): string {
  return two.trim() ? `${initial(one)}&${initial(two)}` : initial(one);
}

/** ["A", "D"], or ["M"] for single-host events. */
export function initialsOf(one: string, two: string): string[] {
  return [one, two].map(initial).filter(Boolean);
}

/** "Anna & David" or just "Mariam" for single-host events. */
export function displayNames(one: string, two: string): string {
  return two.trim() ? `${one} & ${two}` : one;
}
