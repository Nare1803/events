import { z } from "zod";
import { cleanLine, cleanText, normalizePhone } from "./sanitize";

export const lineField = (max: number) => z.string().max(max * 2).transform(cleanLine).pipe(z.string().max(max));

export const requiredLine = (max: number) =>
  z.string().max(max * 2).transform(cleanLine).pipe(z.string().min(1, "Required").max(max));

export const optionalText = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform(cleanText)
    .pipe(z.string().max(max))
    .transform((v) => (v === "" ? null : v))
    .nullish();

export const phoneField = z
  .string()
  .max(40)
  .transform((v) => v.trim())
  .refine((v) => v === "" || /^\+?[\d\s().-]{6,24}$/.test(v), "Invalid phone number")
  .transform((v) => (v === "" ? null : normalizePhone(v)))
  .nullish();

export const emailField = z
  .string()
  .max(200)
  .transform((v) => v.trim().toLowerCase())
  .refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email")
  .transform((v) => (v === "" ? null : v))
  .nullish();

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #BBAA9D");

export const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/** Map of field → first error message, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
