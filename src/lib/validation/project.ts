import { z } from "zod";
import { LOCALES } from "@/lib/i18n/locales";
import { emailField, isoDate, lineField, optionalText, phoneField, requiredLine, timeOfDay } from "./common";
import { COUPLE_EVENTS, EVENT_TYPES } from "./enums";
import { timezoneField } from "./event";

export const CONTACT_METHODS = ["WHATSAPP", "TELEGRAM", "PHONE", "EMAIL"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_LABELS: Record<ContactMethod, string> = {
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
  PHONE: "Phone call",
  EMAIL: "Email",
};

export const customerSchema = z
  .object({
    name: requiredLine(120),
    email: emailField,
    phone: phoneField,
    preferredContact: z.enum(CONTACT_METHODS),
    locale: z.enum(LOCALES),
  })
  .refine((c) => !!c.email || !!c.phone, { message: "Add an email or a phone number", path: ["phone"] });

/** Studio "new project" form — for customers who reached ORÉ by phone, Instagram, etc. */
export const quickProjectSchema = z
  .object({
    eventType: z.enum(EVENT_TYPES),
    partnerOne: requiredLine(60),
    partnerTwo: lineField(60),
    date: isoDate,
    time: timeOfDay,
    timezone: timezoneField,
    templateKey: z.string().max(40),
    packageId: z.string().max(40),
  })
  .refine((p) => !COUPLE_EVENTS.includes(p.eventType) || p.partnerTwo.length > 0, {
    message: "Required for couples",
    path: ["partnerTwo"],
  });

export const revisionMessageSchema = z.object({ message: z.string().max(4000).transform((v) => v.trim()).pipe(z.string().min(3)) });

export const packageSchema = z.object({
  name: requiredLine(60),
  tagline: lineField(120),
  description: optionalText(1000),
  features: z.string().max(3000),
  includedRevisions: z.union([z.literal(""), z.coerce.number().int().min(0).max(50)]),
  priceAmount: z.union([z.literal(""), z.coerce.number().int().min(0).max(100_000_000)]),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "3-letter code, e.g. AMD"),
  sortOrder: z.coerce.number().int().min(0).max(999),
});
