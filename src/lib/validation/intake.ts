import { z } from "zod";
import { LOCALES } from "@/lib/i18n/locales";
import { VIBES } from "@/lib/projects/intake";
import { emailField, hexColor, isoDate, lineField, optionalText, phoneField, requiredLine } from "./common";
import { COUPLE_EVENTS, EVENT_TYPES } from "./enums";
import { importRowSchema, MAX_IMPORT_ROWS } from "./guest";
import { CONTACT_METHODS } from "./project";

export const DRAFT_KEY_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;
export const UPLOAD_KINDS = ["HERO", "GALLERY", "ENGAGEMENT", "DRESS_CODE", "MUSIC"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** How many files of each kind the order form accepts. */
export const UPLOAD_LIMITS: Record<UploadKind, number> = { HERO: 1, GALLERY: 12, ENGAGEMENT: 6, DRESS_CODE: 1, MUSIC: 1 };

export const RSVP_FIELDS = ["attendance", "guestCount", "companions", "transportation", "dietary", "message", "phone"] as const;

const scheduleRow = z.object({
  time: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")]),
  title: lineField(120),
  venue: lineField(120),
  address: lineField(300),
  notes: lineField(400),
});

/** Full order-form submission, validated again on the server. */
export const intakeSchema = z
  .object({
    draftKey: z.string().regex(DRAFT_KEY_PATTERN),
    event: z.object({
      type: z.enum(EVENT_TYPES),
      partnerOne: requiredLine(60),
      partnerTwo: lineField(60),
      date: isoDate,
      locale: z.enum(LOCALES),
      extraLocales: z.array(z.enum(LOCALES)).max(3),
    }),
    templateKey: z.string().max(40),
    story: z.object({
      writeForMe: z.boolean(),
      welcomeText: optionalText(1500),
      vibe: z.array(z.enum(VIBES)).max(VIBES.length),
    }),
    music: z.object({
      choice: z.enum(["UPLOAD", "REFERENCE", "NONE", "RECOMMEND"]),
      reference: optionalText(500),
      rightsConfirmed: z.boolean(),
    }),
    schedule: z.array(scheduleRow).max(15),
    dressCode: z.object({
      enabled: z.boolean(),
      name: lineField(80),
      description: optionalText(600),
      colors: z.array(hexColor).max(6),
    }),
    rsvp: z.object({
      fields: z.array(z.enum(RSVP_FIELDS)).max(RSVP_FIELDS.length),
      deadline: z.union([isoDate, z.literal("")]),
    }),
    guests: z.object({
      mode: z.enum(["upload", "later", "none"]),
      rows: z.array(importRowSchema).max(MAX_IMPORT_ROWS),
    }),
    notes: optionalText(4000),
    contact: z
      .object({
        name: requiredLine(120),
        email: emailField,
        phone: phoneField,
        preferredContact: z.enum(CONTACT_METHODS),
      })
      .refine((c) => !!c.email || !!c.phone, { message: "Add an email or a phone number", path: ["phone"] }),
    packageKey: z.string().max(40),
    consent: z.literal(true),
    /** Honeypot. */
    website: z.string().max(200).optional(),
  })
  .refine((d) => !COUPLE_EVENTS.includes(d.event.type) || d.event.partnerTwo.length > 0, {
    message: "Required",
    path: ["event", "partnerTwo"],
  });

export type IntakeSubmission = z.infer<typeof intakeSchema>;
