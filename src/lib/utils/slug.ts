const ARMENIAN: Record<string, string> = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "y", թ: "t", ժ: "zh", ի: "i", լ: "l",
  խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz", ղ: "gh", ճ: "ch", մ: "m", յ: "y", ն: "n", շ: "sh",
  ո: "o", չ: "ch", պ: "p", ջ: "j", ռ: "r", ս: "s", վ: "v", տ: "t", ր: "r", ց: "ts", ւ: "v",
  փ: "p", ք: "k", օ: "o", ֆ: "f", և: "ev",
};

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k",
  л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Lowercase ASCII slug; transliterates Armenian and Russian names. */
export function slugify(input: string, maxLength = 40): string {
  const lower = input.toLowerCase().replace(/ու/g, "u");
  let out = "";
  for (const char of lower) out += ARMENIAN[char] ?? CYRILLIC[char] ?? char;
  return out
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Short, unambiguous random suffix (no 0/o/1/l/i). */
export function randomSuffix(length = 4): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * Personal guest slug such as "naz-k3f9": elegant, yet not guessable from the
 * guest's name alone, so invitations cannot be enumerated.
 */
export function guestSlug(name: string): string {
  const base = slugify(name, 24) || "guest";
  return `${base}-${randomSuffix(4)}`;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Top-level paths that can never be used as an event slug. */
export const RESERVED_SLUGS = new Set([
  "api", "dashboard", "login", "logout", "register", "admin", "demo", "review", "create", "designs", "about", "contact", "privacy", "terms", "static", "uploads", "demo-assets",
  "_next", "favicon.ico", "robots.txt", "sitemap.xml", "icon", "apple-icon", "opengraph-image", "settings",
]);
