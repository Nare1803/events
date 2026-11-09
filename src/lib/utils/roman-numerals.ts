const TABLE: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** 1–3999 → Roman numerals; anything else falls back to digits. */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);
  let rest = value;
  let out = "";
  for (const [n, letters] of TABLE) {
    while (rest >= n) {
      out += letters;
      rest -= n;
    }
  }
  return out;
}

/** 18 · 7 · 2027 → "XVIII · VII · MMXXVII" */
export function romanDate(day: number, month: number, year: number): string {
  return [day, month, year].map(toRoman).join(" · ");
}
