/** Removes control characters (keeps newlines/tabs) and trims. React escapes output, so no HTML encoding is needed here. */
export function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

/** Collapses internal whitespace — for single-line values such as names. */
export function cleanLine(value: string): string {
  return cleanText(value).replace(/\s+/g, " ");
}

/** Normalises a phone number to digits with an optional leading "+". */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/** Guards spreadsheet exports against formula injection. */
export function csvSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
