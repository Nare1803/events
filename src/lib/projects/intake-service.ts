import "server-only";
import { db } from "@/lib/db";
import { serializeLocalized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/locales";
import { isSelectableTheme, DEFAULT_THEME_ID } from "@/lib/themes";
import { zonedToUtc } from "@/lib/utils/dates";
import { guestSlug } from "@/lib/utils/slug";
import { normalizeContact, normalizeGuestName } from "@/lib/validation/guest";
import type { IntakeSubmission } from "@/lib/validation/intake";
import type { LocationKind } from "@/lib/validation/enums";
import type { IntakeBrief } from "./intake";
import { draftEventData, eventSlugBase, generateReference, generateReviewToken, logActivity, uniqueEventSlug } from "./service";

const TIMEZONE = "Asia/Yerevan";
const MAX_GALLERY = 8;

/** Best guess of a venue's role from the customer's own words (staff can change it). */
function guessKind(text: string): LocationKind {
  const t = text.toLowerCase();
  if (/church|cathedral|եկեղեց|մայր տաճար|церк|собор|храм/.test(t)) return "CHURCH";
  if (/ceremon|registry|wedding|պսակ|արարող|церемон|загс/.test(t)) return "CEREMONY";
  if (/party|after|club|бар|вечерин|երեկույթ/.test(t)) return "PARTY";
  if (/restaurant|dinner|reception|banquet|hall|ռեստորան|ընթրիք|սրահ|ресторан|банкет|ужин|зал/.test(t)) return "RECEPTION";
  return "OTHER";
}

/**
 * Turns an order-form submission into a customer, a private draft event that
 * is already filled with everything the customer gave us, and a NEW_REQUEST
 * project in the studio pipeline.
 */
export async function createProjectFromIntake(data: IntakeSubmission): Promise<{ reference: string }> {
  const locale: Locale = data.event.locale;
  const L = (value: string | null | undefined) => serializeLocalized(value ? { [locale]: value } : {});
  const schedule = data.schedule.filter((row) => row.title || row.venue || row.time);
  const firstTime = schedule.find((row) => row.time)?.time ?? "16:00";
  const themeId = isSelectableTheme(data.templateKey) ? data.templateKey : DEFAULT_THEME_ID;

  const [template, pkg, pendingFiles] = await Promise.all([
    db.template.findFirst({ where: { key: themeId, isPublic: true } }),
    data.packageKey
      ? db.servicePackage.findFirst({ where: { key: data.packageKey, active: true } })
      : db.servicePackage.findFirst({ where: { isDefault: true, active: true } }),
    db.projectFile.findMany({ where: { draftKey: data.draftKey, projectId: null }, orderBy: { createdAt: "asc" } }),
  ]);
  const slug = await uniqueEventSlug(eventSlugBase(data.event.partnerOne, data.event.partnerTwo));
  const reference = await generateReference();
  const locales = Array.from(new Set([locale, ...data.event.extraLocales]));

  const hero = pendingFiles.find((f) => f.kind === "HERO");
  const galleryFiles = [...pendingFiles.filter((f) => f.kind === "GALLERY"), ...pendingFiles.filter((f) => f.kind === "ENGAGEMENT")].slice(0, MAX_GALLERY);
  const dressImage = pendingFiles.find((f) => f.kind === "DRESS_CODE");
  const fields = new Set(data.rsvp.fields);

  const brief: IntakeBrief = {
    vibe: data.story.vibe,
    writeForMe: data.story.writeForMe,
    welcomeText: data.story.welcomeText ?? undefined,
    music: { choice: data.music.choice, reference: data.music.reference ?? undefined, rightsConfirmedByCustomer: data.music.rightsConfirmed },
    dressCode: data.dressCode.enabled ? { name: data.dressCode.name, description: data.dressCode.description ?? undefined, colors: data.dressCode.colors } : undefined,
    rsvpFields: data.rsvp.fields,
    rsvpDeadline: data.rsvp.deadline || undefined,
    guestList: { provided: data.guests.mode === "upload" && data.guests.rows.length > 0, count: data.guests.rows.length, later: data.guests.mode === "later" },
    notes: data.notes ?? undefined,
    languages: locales,
    packageKey: pkg?.key,
  };

  // De-duplicate guests (same name, phone or email) and give each a private link.
  const seenNames = new Set<string>();
  const seenContacts = new Set<string>();
  const guestRows = data.guests.mode === "upload" ? data.guests.rows : [];
  const guests = guestRows.filter((g) => {
    const name = normalizeGuestName(g.name);
    const contacts = [normalizeContact(g.phone), normalizeContact(g.email)].filter(Boolean);
    if (seenNames.has(name) || contacts.some((c) => seenContacts.has(c))) return false;
    seenNames.add(name);
    contacts.forEach((c) => seenContacts.add(c));
    return true;
  });
  const slugs = new Set<string>();
  const guestData = guests.map((g) => {
    let s = guestSlug(g.name);
    while (slugs.has(s)) s = guestSlug(g.name);
    slugs.add(s);
    return { name: g.name, phone: g.phone ?? null, email: g.email ?? null, allowedGuests: g.allowedGuests, slug: s, source: "IMPORT" };
  });

  await db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name: data.contact.name,
        email: data.contact.email ?? null,
        phone: data.contact.phone ?? null,
        preferredContact: data.contact.preferredContact,
        locale,
      },
    });

    const base = draftEventData(
      {
        eventType: data.event.type,
        partnerOne: data.event.partnerOne,
        partnerTwo: data.event.partnerTwo,
        date: data.event.date,
        time: firstTime,
        timezone: TIMEZONE,
        locale,
        locales,
        themeId,
      },
      slug,
    );
    const event = await tx.event.create({
      data: {
        ...base,
        heroImage: hero?.url ?? null,
        ...(data.story.welcomeText && !data.story.writeForMe ? { welcomeText: L(data.story.welcomeText) } : {}),
        invitationSettings: {
          create: {
            askGuestCount: fields.has("guestCount"),
            askCompanions: fields.has("companions"),
            askTransportation: fields.has("transportation"),
            askDietary: fields.has("dietary"),
            askMessage: fields.has("message"),
            askPhone: fields.has("phone"),
            rsvpDeadline: data.rsvp.deadline ? zonedToUtc(data.rsvp.deadline, "23:59", TIMEZONE) : null,
          },
        },
        dressCode: {
          create: {
            enabled: data.dressCode.enabled,
            title: L(data.dressCode.name),
            description: L(data.dressCode.description),
            swatches: JSON.stringify(data.dressCode.colors.map((hex) => ({ hex: hex.toUpperCase(), name: {} }))),
            image: dressImage?.url ?? null,
          },
        },
      },
    });

    // Venues from the customer's timeline, then the timeline itself.
    const venueIds = new Map<string, string>();
    for (const row of schedule) {
      if (!row.venue && !row.address) continue;
      const key = `${row.venue}|${row.address}`.toLowerCase();
      if (venueIds.has(key)) continue;
      const location = await tx.location.create({
        data: {
          eventId: event.id,
          position: venueIds.size,
          kind: guessKind(`${row.title} ${row.venue}`),
          name: L(row.venue || row.title),
          address: row.address || row.venue,
        },
      });
      venueIds.set(key, location.id);
    }
    let position = 0;
    for (const row of schedule) {
      if (!row.time || !row.title) continue;
      await tx.scheduleItem.create({
        data: {
          eventId: event.id,
          position: position++,
          startTime: row.time,
          title: L(row.title),
          description: L(row.notes),
          locationId: venueIds.get(`${row.venue}|${row.address}`.toLowerCase()) ?? null,
        },
      });
    }

    for (const [i, file] of galleryFiles.entries()) {
      await tx.galleryImage.create({
        data: { eventId: event.id, position: i, src: file.url, width: file.width ?? 1200, height: file.height ?? 1600, placeholder: file.placeholder },
      });
    }

    if (guestData.length) await tx.guest.createMany({ data: guestData.map((g) => ({ ...g, eventId: event.id })) });

    const project = await tx.invitationProject.create({
      data: {
        reference,
        reviewToken: generateReviewToken(),
        customerId: customer.id,
        eventId: event.id,
        packageId: pkg?.id ?? null,
        templateId: template?.id ?? null,
        status: "NEW_REQUEST",
        source: "INTAKE",
        intake: JSON.stringify(brief),
      },
    });
    await tx.projectFile.updateMany({ where: { draftKey: data.draftKey, projectId: null }, data: { projectId: project.id, draftKey: null } });
    await logActivity(project.id, "Customer", "Submitted the invitation request", tx);
  });

  return { reference };
}
