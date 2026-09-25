import { z } from "zod";
import { LOCALES } from "@/lib/i18n/locales";
import { SLUG_PATTERN } from "@/lib/utils/slug";
import { emailField, optionalText, phoneField, requiredLine } from "./common";

export const MAX_ALLOWED_GUESTS = 20;
export const MAX_IMPORT_ROWS = 1000;

const allowedGuests = z.coerce
  .number({ error: "Must be a number" })
  .int("Whole number")
  .min(1, "At least 1")
  .max(MAX_ALLOWED_GUESTS, `At most ${MAX_ALLOWED_GUESTS}`);

export const guestFormSchema = z.object({
  name: requiredLine(120),
  phone: phoneField,
  email: emailField,
  allowedGuests,
  locale: z.union([z.enum(LOCALES), z.literal("")]),
  slug: z.union([z.string().trim().toLowerCase().max(60).regex(SLUG_PATTERN, "Lowercase letters, numbers and hyphens"), z.literal("")]),
  notes: optionalText(1000),
});

/** One row of a CSV/XLSX import. Shared by the client preview and the server. */
export const importRowSchema = z.object({
  name: requiredLine(120),
  phone: phoneField,
  email: emailField,
  allowedGuests: z.union([z.literal(""), allowedGuests]).transform((v) => (v === "" ? 1 : v)),
});

/** Raw cell values from a spreadsheet row, before validation. */
export type ImportRow = { name: string; phone: string; email: string; allowedGuests: string };

export const importPayloadSchema = z.array(importRowSchema).min(1, "Nothing to import").max(MAX_IMPORT_ROWS, `At most ${MAX_IMPORT_ROWS} rows per import`);

export const normalizeGuestName = (name: string) => name.trim().toLocaleLowerCase().replace(/\s+/g, " ");
export const normalizeContact = (value: string | null | undefined) => (value ?? "").replace(/[^\d@a-z.+]/gi, "").toLowerCase();
