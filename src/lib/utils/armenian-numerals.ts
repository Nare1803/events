/**
 * Classical Armenian letter-numerals (as used in manuscripts and on church
 * inscriptions): each decimal place has its own nine letters and the value is
 * the letters written from the highest place down — 2027 → ՍԻԷ.
 */
const PLACES = [
  ["Ա", "Բ", "Գ", "Դ", "Ե", "Զ", "Է", "Ը", "Թ"], // 1–9
  ["Ժ", "Ի", "Լ", "Խ", "Ծ", "Կ", "Հ", "Ձ", "Ղ"], // 10–90
  ["Ճ", "Մ", "Յ", "Ն", "Շ", "Ո", "Չ", "Պ", "Ջ"], // 100–900
  ["Ռ", "Ս", "Վ", "Տ", "Ր", "Ց", "Ւ", "Փ", "Ք"], // 1000–9000
] as const;

/** 1–9999 → Armenian letters; anything outside that range falls back to digits. */
export function toArmenianNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 9999) return String(value);
  let out = "";
  for (let place = 3; place >= 0; place--) {
    const digit = Math.floor(value / 10 ** place) % 10;
    if (digit > 0) out += PLACES[place][digit - 1];
  }
  return out;
}

/** 18 · 7 · 2027 → "ԺԸ · Է · ՍԻԷ" */
export function armenianNumeralDate(day: number, month: number, year: number): string {
  return [day, month, year].map(toArmenianNumeral).join(" · ");
}
