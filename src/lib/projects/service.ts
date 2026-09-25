import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n/locales";
import { serializeLocalized } from "@/lib/i18n/localized";
import { defaultCopyJson } from "@/lib/invitations/defaults";
import { DEFAULT_THEME_ID, isSelectableTheme } from "@/lib/themes";
import { zonedToUtc } from "@/lib/utils/dates";
import { randomSuffix, RESERVED_SLUGS, slugify } from "@/lib/utils/slug";
import type { EventType } from "@/lib/validation/enums";

/** Unguessable capability token for /review/[token] (256 bits). */
export function generateReviewToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Short, human-friendly reference such as "ORE-K3F9Q2" (not used for authorisation). */
export async function generateReference(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const reference = `ORE-${randomSuffix(6).toUpperCase()}`;
    const taken = await db.invitationProject.findUnique({ where: { reference }, select: { id: true } });
    if (!taken) return reference;
  }
  throw new Error("Could not allocate a project reference");
}

export async function uniqueEventSlug(base: string): Promise<string> {
  const root = (base || "celebration").slice(0, 50).replace(/-+$/, "");
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const taken = await db.event.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${randomSuffix(4)}`;
}

export function eventSlugBase(partnerOne: string, partnerTwo: string): string {
  return [slugify(partnerOne, 24), slugify(partnerTwo, 24)].filter(Boolean).join("-");
}

export type DraftEventInput = {
  eventType: EventType;
  partnerOne: string;
  partnerTwo: string;
  date: string;
  time: string;
  timezone: string;
  locale: Locale;
  locales: Locale[];
  themeId: string | null;
};

/**
 * Creates the private DRAFT event behind a project, pre-filled with ORÉ's
 * starter copy and default settings so staff start from something beautiful.
 */
export function draftEventData(input: DraftEventInput, slug: string): Prisma.EventCreateInput {
  const name = (value: string) => serializeLocalized(value ? { [input.locale]: value } : {});
  const locales = input.locales.includes(input.locale) ? input.locales : [input.locale, ...input.locales];
  return {
    slug,
    eventType: input.eventType,
    status: "DRAFT",
    partnerOneName: name(input.partnerOne),
    partnerTwoName: name(input.partnerTwo),
    eventDate: zonedToUtc(input.date, input.time, input.timezone),
    timezone: input.timezone,
    defaultLocale: input.locale,
    enabledLocales: locales.join(","),
    allowLocaleSwitch: locales.length > 1,
    heroSubtitle: input.eventType === "WEDDING" ? defaultCopyJson("heroSubtitle") : "{}",
    welcomeText: defaultCopyJson("welcomeText"),
    invitationText: input.eventType === "WEDDING" ? defaultCopyJson("invitationText") : "{}",
    closingText: defaultCopyJson("closingText"),
    invitationSettings: { create: {} },
    designSettings: { create: { themeId: input.themeId && isSelectableTheme(input.themeId) ? input.themeId : DEFAULT_THEME_ID } },
    musicSettings: { create: {} },
    dressCode: { create: {} },
  };
}

type Tx = Prisma.TransactionClient | typeof db;

export async function logActivity(projectId: string, actor: string, message: string, client: Tx = db) {
  await client.projectActivity.create({ data: { projectId, actor, message } });
}
