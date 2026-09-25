"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { actionError, type ActionState } from "@/lib/actions";
import { verifyPassword } from "@/lib/auth/password";
import { isStaffRole } from "@/lib/auth/roles";
import { createSession, destroySession } from "@/lib/auth/session";
import { str } from "@/lib/forms";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation/common";

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password").max(200),
});

// Always run bcrypt, even for unknown emails, so response timing doesn't reveal accounts.
const DUMMY_HASH = "$2b$12$SeLlrhVLFNMYDBCjkrptMe1wRBLBpQLi8Ep9KDZtGjnaSzOukgjG2";

/** Studio sign-in. Customers don't have accounts in V1 — they use private review links. */
export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const limit = rateLimit(`login:${clientKey(await headers())}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return actionError("Too many sign-in attempts. Please wait a few minutes.");

  const parsed = credentials.safeParse({ email: str(formData, "email"), password: str(formData, "password") });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return actionError("Incorrect email or password.");
  if (!isStaffRole(user.role)) return actionError("This account doesn't have studio access.");

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
