import "server-only";
import { siteUrl } from "@/config/brand";
import { db } from "@/lib/db";
import { csvSafe } from "@/lib/validation/sanitize";

const cell = (value: unknown) => `"${csvSafe(value == null ? "" : String(value)).replace(/"/g, '""')}"`;

/** Guest list with RSVP data as CSV (UTF-8 BOM so Excel shows Armenian/Cyrillic correctly). */
export async function buildGuestCsv(event: { id: string; slug: string }): Promise<string> {
  const guests = await db.guest.findMany({ where: { eventId: event.id }, include: { rsvp: true }, orderBy: { name: "asc" } });
  const header = [
    "Guest", "Phone", "Email", "Allowed guests", "Personal link", "Invitation sent", "First opened", "Last opened",
    "Response", "Respondent name", "Party size", "Companions", "Transportation", "Dietary", "Message", "RSVP phone", "Responded at",
  ];
  const lines = guests.map((g) =>
    [
      g.name, g.phone, g.email, g.allowedGuests, `${siteUrl()}/${event.slug}/${g.slug}`, g.inviteStatus === "SENT" ? "Yes" : "No",
      g.openedAt?.toISOString(), g.lastOpenedAt?.toISOString(),
      g.rsvp ? (g.rsvp.attendance === "ATTENDING" ? "Attending" : "Declined") : "Awaiting",
      g.rsvp?.respondentName, g.rsvp?.guestCount, g.rsvp?.companionNames,
      g.rsvp?.transportationNeeded == null ? "" : g.rsvp.transportationNeeded ? "Yes" : "No",
      g.rsvp?.dietaryRestrictions, g.rsvp?.message, g.rsvp?.phone, g.rsvp?.updatedAt.toISOString(),
    ].map(cell).join(","),
  );
  return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
}

export function csvResponse(csv: string, slug: string): Response {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-guests-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
