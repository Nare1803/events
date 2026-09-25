import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const REVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

/** Resolves a private review link. The token itself is the authorisation (256-bit, unguessable). */
export const findProjectByToken = cache(async (token: string) => {
  if (!REVIEW_TOKEN_PATTERN.test(token)) return null;
  return db.invitationProject.findUnique({
    where: { reviewToken: token },
    include: {
      event: { select: { id: true, slug: true, status: true, timezone: true, partnerOneName: true, partnerTwoName: true, defaultLocale: true, eventDate: true } },
      customer: { select: { name: true, locale: true } },
      package: { select: { name: true, includedRevisions: true } },
      revisions: { orderBy: { createdAt: "desc" } },
    },
  });
});

export function revisionsRemaining(included: number | null | undefined, used: number): number | null {
  if (included == null) return null;
  return Math.max(0, included - used);
}
