import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";
import { isStaffRole, isSuperAdmin } from "./roles";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  // Opportunistic cleanup of expired sessions for this user.
  await db.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; email: string; name: string; role: string };

/** Resolves the signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true, name: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/** Studio access: SUPER_ADMIN or STAFF. Anyone else is sent to the sign-in page. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) redirect("/login");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireStaff();
  if (!isSuperAdmin(user.role)) notFound();
  return user;
}

/**
 * Authorisation boundary for every studio read/write on an event.
 * Unknown events are a 404; non-staff never get this far.
 */
export async function requireEventAccess(eventId: string) {
  const user = await requireStaff();
  if (typeof eventId !== "string" || eventId.length > 64) notFound();
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();
  return { user, event };
}
