export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ATTENDANCE = ["ATTENDING", "DECLINED"] as const;
export type Attendance = (typeof ATTENDANCE)[number];

export const LOCATION_KINDS = ["CHURCH", "CEREMONY", "RECEPTION", "PARTY", "OTHER"] as const;
export type LocationKind = (typeof LOCATION_KINDS)[number];

export const GUEST_SOURCES = ["ADMIN", "IMPORT", "PUBLIC_RSVP"] as const;
export type GuestSource = (typeof GUEST_SOURCES)[number];

export const INVITE_STATUSES = ["NOT_SENT", "SENT"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const SCHEDULE_ICONS = ["rings", "church", "glass", "dinner", "music", "cake", "car", "camera", "sparkle", "moon"] as const;
export type ScheduleIcon = (typeof SCHEDULE_ICONS)[number];

export function asEnum<T extends readonly string[]>(values: T, value: string, fallback: T[number]): T[number] {
  return (values as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

export const EVENT_TYPES = ["WEDDING", "ENGAGEMENT", "BIRTHDAY", "BAPTISM", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Couples (wedding, engagement) have two names; other events usually one host. */
export const COUPLE_EVENTS: readonly EventType[] = ["WEDDING", "ENGAGEMENT"];
