import { importRowSchema, normalizeContact, normalizeGuestName, type ImportRow } from "@/lib/validation/guest";

/** RFC 4180-style CSV parser (quotes, escaped quotes, CRLF, BOM). Auto-detects `,` or `;`. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  name: ["name", "guest", "guest name", "full name", "անուն", "имя"],
  phone: ["phone", "phone number", "mobile", "tel", "հեռախոս", "телефон"],
  email: ["email", "e-mail", "mail", "էլ. փոստ", "почта"],
  allowedGuests: ["allowedguests", "allowed guests", "guests", "party size", "seats", "count", "հյուրեր", "гости"],
};

export type PreviewRow = {
  line: number;
  values: ImportRow;
  errors: string[];
  duplicate: "file" | "existing" | null;
};

export type ExistingGuestKeys = { names: string[]; contacts: string[] };

/** Maps a sheet (first row = headers) to import rows with validation and duplicate flags. */
export function buildPreview(sheet: string[][], existing: ExistingGuestKeys): { rows: PreviewRow[]; missingName: boolean } {
  if (sheet.length === 0) return { rows: [], missingName: true };
  const headers = sheet[0].map((h) => h.trim().toLowerCase());
  const index = (key: keyof ImportRow) => headers.findIndex((h) => HEADER_ALIASES[key].includes(h));
  const cols = { name: index("name"), phone: index("phone"), email: index("email"), allowedGuests: index("allowedGuests") };
  if (cols.name === -1) return { rows: [], missingName: true };

  const existingNames = new Set(existing.names.map(normalizeGuestName));
  const existingContacts = new Set(existing.contacts.map(normalizeContact).filter(Boolean));
  const seenNames = new Set<string>();
  const seenContacts = new Set<string>();

  const rows = sheet.slice(1).map((cells, i): PreviewRow => {
    const get = (col: number) => (col >= 0 ? String(cells[col] ?? "").trim() : "");
    const values: ImportRow = {
      name: get(cols.name),
      phone: get(cols.phone),
      email: get(cols.email),
      allowedGuests: get(cols.allowedGuests),
    };
    const parsed = importRowSchema.safeParse(values);
    const errors = parsed.success ? [] : parsed.error.issues.map((issue) => `${String(issue.path[0] ?? "row")}: ${issue.message}`);

    const name = normalizeGuestName(values.name);
    const contacts = [normalizeContact(values.phone), normalizeContact(values.email)].filter(Boolean);
    let duplicate: PreviewRow["duplicate"] = null;
    if (name && (existingNames.has(name) || contacts.some((c) => existingContacts.has(c)))) duplicate = "existing";
    else if (name && (seenNames.has(name) || contacts.some((c) => seenContacts.has(c)))) duplicate = "file";
    seenNames.add(name);
    contacts.forEach((c) => seenContacts.add(c));

    return { line: i + 2, values, errors, duplicate };
  });
  return { rows, missingName: false };
}

export const CSV_TEMPLATE = "name,phone,email,allowedGuests\nNaz,+37491000000,naz@example.com,2\n";
