import { z } from "zod";
import { LOCALES } from "@/lib/i18n/locales";
import { isValidTimeZone } from "@/lib/utils/dates";
import { RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/utils/slug";
import { LOCATION_KINDS, SCHEDULE_ICONS } from "./enums";
import { hexColor, isoDate, requiredLine, timeOfDay } from "./common";

export const timezoneField = z.string().max(64).refine(isValidTimeZone, "Unknown timezone");

export const eventSlugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(60)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens")
  .refine((s) => !RESERVED_SLUGS.has(s), "This address is reserved");

export const eventContentSchema = z.object({
  date: isoDate,
  time: timeOfDay,
});

export const settingsSchema = z.object({
  slug: eventSlugField,
  defaultLocale: z.enum(LOCALES),
  enabledLocales: z.array(z.enum(LOCALES)).min(1, "Enable at least one language"),
  timezone: timezoneField,
  rsvpDeadline: z.union([isoDate, z.literal("")]),
  defaultAllowedGuests: z.coerce.number().int("Whole number").min(1, "At least 1").max(20, "At most 20"),
});

export const designSchema = z.object({
  themeId: z.string().max(40),
  accentColor: z.union([hexColor, z.literal("")]),
  heroOverlay: z.coerce.number().int().min(0).max(80),
});

export const musicSchema = z.object({
  title: z.string().max(120),
  artist: z.string().max(120),
  volume: z.coerce.number().int().min(0).max(100),
});

export const scheduleItemSchema = z.object({
  startTime: timeOfDay,
  icon: z.union([z.enum(SCHEDULE_ICONS), z.literal("")]),
  locationId: z.string().max(40),
});

export const locationSchema = z.object({
  kind: z.enum(LOCATION_KINDS),
  address: requiredLine(300),
  latitude: z.union([z.coerce.number().min(-90).max(90), z.literal("")]),
  longitude: z.union([z.coerce.number().min(-180).max(180), z.literal("")]),
});

export const swatchSchema = z.object({ hex: hexColor });
