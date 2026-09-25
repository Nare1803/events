import { z } from "zod";
import { LOCALES } from "@/lib/i18n/locales";
import { SLUG_PATTERN } from "@/lib/utils/slug";
import { ATTENDANCE } from "./enums";
import { optionalText, phoneField, requiredLine } from "./common";

/** Payload accepted by the public RSVP endpoint. */
export const rsvpInputSchema = z.object({
  guestSlug: z.string().max(80).regex(SLUG_PATTERN).optional(),
  name: requiredLine(120),
  attendance: z.enum(ATTENDANCE),
  guestCount: z.number().int().min(0).max(30),
  companionNames: optionalText(500),
  transportationNeeded: z.boolean().nullish(),
  dietaryRestrictions: optionalText(500),
  message: optionalText(1500),
  phone: phoneField,
  locale: z.enum(LOCALES).optional(),
  /** Honeypot — real guests never see or fill this field. */
  website: z.string().max(200).optional(),
});

export type RsvpInput = z.infer<typeof rsvpInputSchema>;

export const openEventSchema = z.object({
  guestSlug: z.string().max(80).regex(SLUG_PATTERN).optional(),
});
