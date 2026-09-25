"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { requireEventAccess } from "@/lib/auth/session";
import { bool, readLocalized, readLocalizedJson, resolveImageField, str } from "@/lib/forms";
import { LOCALES, parseLocaleList, type Locale } from "@/lib/i18n/locales";
import { serializeLocalized } from "@/lib/i18n/localized";
import { isSelectableTheme } from "@/lib/themes";
import { UploadError, isUploadFile, removeUpload, storeAudio } from "@/lib/storage";
import { utcToZonedInput, zonedToUtc } from "@/lib/utils/dates";
import { fieldErrors, hexColor } from "@/lib/validation/common";
import { asEnum, EVENT_TYPES, COUPLE_EVENTS } from "@/lib/validation/enums";
import { designSchema, eventContentSchema, musicSchema, settingsSchema } from "@/lib/validation/event";
import { revalidateEvent } from "@/server/revalidate";

function uploadFailure(error: unknown): ActionState {
  if (error instanceof UploadError) return actionError(error.message);
  throw error;
}

export async function updateInvitationAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = eventContentSchema.safeParse({ date: str(fd, "date"), time: str(fd, "time") });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));

  const eventType = asEnum(EVENT_TYPES, str(fd, "eventType"), "WEDDING");
  const partnerOne = readLocalized(fd, "partnerOneName", 60);
  const partnerTwo = readLocalized(fd, "partnerTwoName", 60);
  const needsTwo = COUPLE_EVENTS.includes(eventType);
  if (!Object.keys(partnerOne).length || (needsTwo && !Object.keys(partnerTwo).length)) {
    return actionError("Please fill in the names in at least one language.", {
      ...(Object.keys(partnerOne).length ? {} : { partnerOneName: "Required" }),
      ...(needsTwo && !Object.keys(partnerTwo).length ? { partnerTwoName: "Required" } : {}),
    });
  }

  try {
    const hero = await resolveImageField(fd, "heroImage", event.heroImage, event.id);
    const closing = await resolveImageField(fd, "closingImage", event.closingImage, event.id);
    const social = await resolveImageField(fd, "socialImage", event.socialImage, event.id);

    await db.event.update({
      where: { id: event.id },
      data: {
        eventType,
        partnerOneName: serializeLocalized(partnerOne),
        partnerTwoName: serializeLocalized(partnerTwo),
        eventDate: zonedToUtc(parsed.data.date, parsed.data.time, event.timezone),
        heroSubtitle: readLocalizedJson(fd, "heroSubtitle", 200),
        welcomeText: readLocalizedJson(fd, "welcomeText", 600),
        invitationText: readLocalizedJson(fd, "invitationText", 1200),
        closingText: readLocalizedJson(fd, "closingText", 300),
        socialDescription: readLocalizedJson(fd, "socialDescription", 200),
        heroImage: hero.url,
        closingImage: closing.url,
        socialImage: social.url,
      },
    });
  } catch (error) {
    return uploadFailure(error);
  }
  revalidateEvent(event);
  return actionOk("Invitation saved");
}

export async function updateDressCodeAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const current = await db.dressCode.findUnique({ where: { eventId: event.id } });

  const swatches: { hex: string; name: Record<string, string> }[] = [];
  for (let i = 0; i < 8; i++) {
    const hex = str(fd, `swatch${i}.hex`).trim();
    if (!hex) continue;
    if (!hexColor.safeParse(hex).success) return actionError("Colours must be hex values such as #BBAA9D.", { [`swatch${i}.hex`]: "Invalid colour" });
    swatches.push({ hex: hex.toUpperCase(), name: readLocalized(fd, `swatch${i}.name`, 40) });
  }

  try {
    const image = await resolveImageField(fd, "dressImage", current?.image ?? null, event.id);
    const data = {
      enabled: bool(fd, "enabled"),
      title: readLocalizedJson(fd, "title", 80),
      description: readLocalizedJson(fd, "description", 600),
      swatches: JSON.stringify(swatches),
      image: image.url,
    };
    await db.dressCode.upsert({ where: { eventId: event.id }, create: { eventId: event.id, ...data }, update: data });
  } catch (error) {
    return uploadFailure(error);
  }
  revalidateEvent(event);
  return actionOk("Dress code saved");
}

export async function updateSettingsAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = settingsSchema.safeParse({
    slug: str(fd, "slug"),
    defaultLocale: str(fd, "defaultLocale"),
    enabledLocales: LOCALES.filter((l) => bool(fd, `locale.${l}`)),
    timezone: str(fd, "timezone"),
    rsvpDeadline: str(fd, "rsvpDeadline"),
    defaultAllowedGuests: str(fd, "defaultAllowedGuests"),
  });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const d = parsed.data;

  if (d.slug !== event.slug) {
    const taken = await db.event.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (taken) return actionError("That address is already taken.", { slug: "Already in use" });
  }

  const locales: Locale[] = parseLocaleList(d.enabledLocales.join(","), d.defaultLocale);
  // Keep the same wall-clock time when the timezone changes.
  const wallClock = utcToZonedInput(event.eventDate, event.timezone);
  const eventDate = d.timezone === event.timezone ? event.eventDate : zonedToUtc(wallClock.date, wallClock.time, d.timezone);

  await db.event.update({
    where: { id: event.id },
    data: {
      slug: d.slug,
      defaultLocale: d.defaultLocale,
      enabledLocales: locales.join(","),
      allowLocaleSwitch: bool(fd, "allowLocaleSwitch"),
      timezone: d.timezone,
      eventDate,
      indexable: bool(fd, "indexable"),
      invitationSettings: {
        upsert: {
          create: {},
          update: {
            rsvpEnabled: bool(fd, "rsvpEnabled"),
            rsvpDeadline: d.rsvpDeadline ? zonedToUtc(d.rsvpDeadline, "23:59", d.timezone) : null,
            allowRsvpUpdates: bool(fd, "allowRsvpUpdates"),
            openRsvp: bool(fd, "openRsvp"),
            askTransportation: bool(fd, "askTransportation"),
            askDietary: bool(fd, "askDietary"),
            askPhone: bool(fd, "askPhone"),
            askMessage: bool(fd, "askMessage"),
            askGuestCount: bool(fd, "askGuestCount"),
            askCompanions: bool(fd, "askCompanions"),
            defaultAllowedGuests: d.defaultAllowedGuests,
            showCountdown: bool(fd, "showCountdown"),
            showGallery: bool(fd, "showGallery"),
            showSchedule: bool(fd, "showSchedule"),
            showLocations: bool(fd, "showLocations"),
          },
        },
      },
    },
  });
  revalidateEvent(event);
  if (d.slug !== event.slug) revalidateEvent({ id: event.id, slug: d.slug });
  return actionOk("Settings saved");
}

export async function updateDesignAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = designSchema.safeParse({
    themeId: str(fd, "themeId"),
    accentColor: str(fd, "accentColor").trim(),
    heroOverlay: str(fd, "heroOverlay"),
  });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  if (!isSelectableTheme(parsed.data.themeId)) return actionError("This theme isn't available yet.", { themeId: "Unavailable" });

  const data = {
    themeId: parsed.data.themeId,
    accentColor: bool(fd, "useAccent") && parsed.data.accentColor ? parsed.data.accentColor : null,
    heroOverlay: parsed.data.heroOverlay,
    showMonogram: bool(fd, "showMonogram"),
  };
  await db.designSettings.upsert({ where: { eventId: event.id }, create: { eventId: event.id, ...data }, update: data });
  revalidateEvent(event);
  return actionOk("Design saved");
}

export async function updateMusicAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = musicSchema.safeParse({ title: str(fd, "title").trim(), artist: str(fd, "artist").trim(), volume: str(fd, "volume") });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const current = await db.musicSettings.findUnique({ where: { eventId: event.id } });

  let trackUrl = current?.trackUrl ?? null;
  try {
    const file = fd.get("trackFile");
    if (isUploadFile(file)) {
      const url = await storeAudio(event.id, file);
      await removeUpload(trackUrl);
      trackUrl = url;
    } else if (bool(fd, "removeTrack")) {
      await removeUpload(trackUrl);
      trackUrl = null;
    }
  } catch (error) {
    return uploadFailure(error);
  }

  const enabled = bool(fd, "enabled");
  const rightsConfirmed = bool(fd, "rightsConfirmed");
  const source = trackUrl ? asEnum(["UPLOAD", "LIBRARY"] as const, str(fd, "source"), "UPLOAD") : "NONE";
  if (enabled && !trackUrl) return actionError("Upload a track before enabling music.", { trackFile: "A track is required" });
  if (enabled && !rightsConfirmed) {
    return actionError("Confirm the music rights before enabling playback.", { rightsConfirmed: "Required to play music" });
  }

  const data = {
    enabled,
    source,
    trackUrl,
    rightsConfirmed,
    licenseNote: str(fd, "licenseNote").trim().slice(0, 300) || null,
    title: parsed.data.title || null,
    artist: parsed.data.artist || null,
    volume: parsed.data.volume,
  };
  await db.musicSettings.upsert({ where: { eventId: event.id }, create: { eventId: event.id, ...data }, update: data });
  revalidateEvent(event);
  return actionOk("Music saved");
}

export async function deleteEventAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  if (str(fd, "confirmSlug").trim() !== event.slug) {
    return actionError("Type the invitation address exactly to confirm.", { confirmSlug: "Doesn't match" });
  }
  const [gallery, locations, dress, music] = await Promise.all([
    db.galleryImage.findMany({ where: { eventId: event.id }, select: { src: true } }),
    db.location.findMany({ where: { eventId: event.id }, select: { image: true } }),
    db.dressCode.findUnique({ where: { eventId: event.id }, select: { image: true } }),
    db.musicSettings.findUnique({ where: { eventId: event.id }, select: { trackUrl: true } }),
  ]);
  await db.event.delete({ where: { id: event.id } });
  const files = [event.heroImage, event.closingImage, event.socialImage, dress?.image, music?.trackUrl, ...gallery.map((g) => g.src), ...locations.map((l) => l.image)];
  await Promise.all(files.map((f) => removeUpload(f)));
  revalidatePath("/admin");
  redirect("/admin");
}
