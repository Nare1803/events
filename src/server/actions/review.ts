"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { str } from "@/lib/forms";
import { REVIEW_TOKEN_PATTERN } from "@/lib/projects/review";
import { logActivity } from "@/lib/projects/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/validation/sanitize";

/*
 * Customer actions on the private review page. They are public endpoints:
 * the review token is the only authorisation, so every call re-validates it
 * and the current project status. Error messages are codes the page localises.
 */

async function guard(token: string) {
  const limit = rateLimit(`review:${clientKey(await headers())}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return { ok: false as const, error: actionError("RATE_LIMITED") };
  if (typeof token !== "string" || !REVIEW_TOKEN_PATTERN.test(token)) return { ok: false as const, error: actionError("NOT_FOUND") };
  const project = await db.invitationProject.findUnique({
    where: { reviewToken: token },
    include: { package: { select: { includedRevisions: true } }, event: { select: { id: true } } },
  });
  if (!project) return { ok: false as const, error: actionError("NOT_FOUND") };
  return { ok: true as const, project };
}

function refresh(projectId: string, eventId: string) {
  revalidatePath("/review/[token]", "page");
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/events/${eventId}`, "layout");
}

export async function approveInvitationAction(token: string): Promise<ActionState> {
  const guarded = await guard(token);
  if (!guarded.ok) return guarded.error;
  const { project } = guarded;
  if (project.status !== "READY_FOR_REVIEW") return actionError("NOT_ALLOWED");
  await db.invitationProject.update({ where: { id: project.id }, data: { status: "APPROVED", approvedAt: new Date() } });
  await logActivity(project.id, "Customer", "Approved the invitation");
  refresh(project.id, project.event.id);
  return actionOk("APPROVED");
}

export async function requestChangesAction(token: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const guarded = await guard(token);
  if (!guarded.ok) return guarded.error;
  const { project } = guarded;
  const message = cleanText(str(fd, "message")).slice(0, 4000);
  if (message.length < 3) return actionError("TOO_SHORT", { message: "TOO_SHORT" });
  if (project.status !== "READY_FOR_REVIEW" && project.status !== "CHANGES_REQUESTED") return actionError("NOT_ALLOWED");

  // A new round starts when the customer reacts to a fresh preview; extra notes
  // sent while changes are already in progress join the current round.
  const newRound = project.status === "READY_FOR_REVIEW";
  const round = newRound ? project.revisionCount + 1 : Math.max(1, project.revisionCount);
  const included = project.package?.includedRevisions;

  await db.$transaction([
    db.revisionRequest.create({
      data: { projectId: project.id, message, round, withinPackage: included == null || round <= included },
    }),
    db.invitationProject.update({
      where: { id: project.id },
      data: { status: "CHANGES_REQUESTED", ...(newRound ? { revisionCount: round } : {}) },
    }),
  ]);
  await logActivity(project.id, "Customer", newRound ? `Requested changes (round ${round})` : `Added notes to round ${round}`);
  refresh(project.id, project.event.id);
  return actionOk("CHANGES_RECEIVED");
}
