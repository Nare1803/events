"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { requireStaff } from "@/lib/auth/session";
import { str } from "@/lib/forms";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isProjectStatus, STATUS_META, type ProjectStatus } from "@/lib/projects/status";
import {
  draftEventData,
  eventSlugBase,
  generateReference,
  generateReviewToken,
  logActivity,
  uniqueEventSlug,
} from "@/lib/projects/service";
import { cleanText } from "@/lib/validation/sanitize";
import { fieldErrors } from "@/lib/validation/common";
import { customerSchema, quickProjectSchema } from "@/lib/validation/project";

async function loadProject(projectId: string) {
  const user = await requireStaff();
  if (typeof projectId !== "string" || projectId.length > 64) return { user, project: null };
  const project = await db.invitationProject.findUnique({ where: { id: projectId }, include: { event: true } });
  return { user, project };
}

function revalidateProject(projectId: string, eventId?: string, slug?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/projects/${projectId}`);
  if (eventId) revalidatePath(`/admin/events/${eventId}`, "layout");
  if (slug) revalidatePath(`/${slug}`, "layout");
  revalidatePath("/review/[token]", "page");
}

function readCustomer(fd: FormData) {
  return customerSchema.safeParse({
    name: str(fd, "customerName"),
    email: str(fd, "customerEmail"),
    phone: str(fd, "customerPhone"),
    preferredContact: str(fd, "preferredContact") || "WHATSAPP",
    locale: str(fd, "customerLocale") || "hy",
  });
}

/** Studio shortcut: create a project for a customer who reached ORÉ directly. */
export async function createProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const customer = readCustomer(fd);
  const project = quickProjectSchema.safeParse({
    eventType: str(fd, "eventType"),
    partnerOne: str(fd, "partnerOne"),
    partnerTwo: str(fd, "partnerTwo"),
    date: str(fd, "date"),
    time: str(fd, "time"),
    timezone: str(fd, "timezone"),
    templateKey: str(fd, "templateKey"),
    packageId: str(fd, "packageId"),
  });
  if (!customer.success || !project.success) {
    const errors = {
      ...(customer.success ? {} : prefixed(fieldErrors(customer.error), "customer")),
      ...(project.success ? {} : fieldErrors(project.error)),
    };
    return actionError("Please check the highlighted fields.", errors);
  }
  const c = customer.data;
  const p = project.data;
  const locale: Locale = isLocale(c.locale) ? c.locale : "hy";

  const [template, pkg] = await Promise.all([
    p.templateKey ? db.template.findUnique({ where: { key: p.templateKey } }) : null,
    p.packageId ? db.servicePackage.findUnique({ where: { id: p.packageId } }) : null,
  ]);
  const slug = await uniqueEventSlug(eventSlugBase(p.partnerOne, p.partnerTwo));
  const reference = await generateReference();

  const created = await db.$transaction(async (tx) => {
    const customerRow = await tx.customer.create({
      data: { name: c.name, email: c.email ?? null, phone: c.phone ?? null, preferredContact: c.preferredContact, locale },
    });
    const event = await tx.event.create({
      data: draftEventData(
        { eventType: p.eventType, partnerOne: p.partnerOne, partnerTwo: p.partnerTwo, date: p.date, time: p.time, timezone: p.timezone, locale, locales: [locale], themeId: template?.key ?? null },
        slug,
      ),
    });
    const row = await tx.invitationProject.create({
      data: {
        reference,
        reviewToken: generateReviewToken(),
        customerId: customerRow.id,
        eventId: event.id,
        templateId: template?.id ?? null,
        packageId: pkg?.id ?? null,
        status: "IN_DESIGN",
        source: "STAFF",
        assignedToId: user.id,
      },
    });
    await logActivity(row.id, user.name, "Project created in the studio", tx);
    return row;
  });

  revalidatePath("/admin");
  redirect(`/admin/projects/${created.id}`);
}

function prefixed(errors: Record<string, string>, prefix: string): Record<string, string> {
  const map: Record<string, string> = { name: "customerName", email: "customerEmail", phone: "customerPhone" };
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [map[k] ?? `${prefix}.${k}`, v]));
}

export async function updateProjectStatusAction(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  const status = str(fd, "status");
  if (!isProjectStatus(status)) return actionError("Unknown status.");
  if (status === "PUBLISHED" || status === "ARCHIVED") {
    return actionError("Use the Publish or Archive buttons — they also update the live invitation.");
  }
  if (status === project.status) return actionOk("No change");
  await db.invitationProject.update({ where: { id: project.id }, data: { status } });
  await logActivity(project.id, user.name, `Status changed to “${STATUS_META[status].label}”`);
  revalidateProject(project.id, project.eventId);
  return actionOk("Status updated");
}

/** Makes the preview visible on the customer's private link. */
export async function sendForReviewAction(projectId: string): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  if (project.status === "PUBLISHED" || project.status === "ARCHIVED") return actionError("This project is already published or archived.");
  await db.invitationProject.update({
    where: { id: project.id },
    data: { status: "READY_FOR_REVIEW", sentForReviewAt: new Date() },
  });
  await logActivity(project.id, user.name, "Preview shared with the customer for review");
  revalidateProject(project.id, project.eventId);
  return actionOk("Ready for review — send the private link to the customer.");
}

export async function publishProjectAction(projectId: string): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  const now = new Date();
  await db.$transaction([
    db.event.update({ where: { id: project.eventId }, data: { status: "PUBLISHED" } }),
    db.invitationProject.update({ where: { id: project.id }, data: { status: "PUBLISHED", publishedAt: project.publishedAt ?? now } }),
  ]);
  await logActivity(
    project.id,
    user.name,
    project.status === "APPROVED" ? "Published after customer approval" : `Published (customer approval not recorded — status was “${STATUS_META[project.status as ProjectStatus]?.label ?? project.status}”)`,
  );
  revalidateProject(project.id, project.eventId, project.event.slug);
  return actionOk("Published — the invitation is live.");
}

export async function archiveProjectAction(projectId: string): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  await db.$transaction([
    db.event.update({ where: { id: project.eventId }, data: { status: "ARCHIVED" } }),
    db.invitationProject.update({ where: { id: project.id }, data: { status: "ARCHIVED" } }),
  ]);
  await logActivity(project.id, user.name, "Project archived — invitation links no longer work");
  revalidateProject(project.id, project.eventId, project.event.slug);
  return actionOk("Archived");
}

/** Takes a published or archived invitation back to a private draft. */
export async function unpublishProjectAction(projectId: string): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  await db.$transaction([
    db.event.update({ where: { id: project.eventId }, data: { status: "DRAFT" } }),
    db.invitationProject.update({ where: { id: project.id }, data: { status: "IN_DESIGN" } }),
  ]);
  await logActivity(project.id, user.name, "Invitation taken offline and returned to design");
  revalidateProject(project.id, project.eventId, project.event.slug);
  return actionOk("The invitation is private again.");
}

export async function regenerateReviewLinkAction(projectId: string): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  await db.invitationProject.update({ where: { id: project.id }, data: { reviewToken: generateReviewToken() } });
  await logActivity(project.id, user.name, "Private review link replaced (the old link no longer works)");
  revalidateProject(project.id);
  return actionOk("New private link created");
}

export async function resolveRevisionAction(projectId: string, revisionId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  const note = cleanText(str(fd, "staffNote")).slice(0, 2000) || null;
  const { count } = await db.revisionRequest.updateMany({
    where: { id: revisionId, projectId: project.id, status: "OPEN" },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedById: user.id, staffNote: note },
  });
  if (!count) return actionError("Revision not found or already resolved.");
  await logActivity(project.id, user.name, "Revision marked as done");
  revalidateProject(project.id);
  return actionOk("Marked as done");
}

export async function updateProjectDetailsAction(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { user, project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  const packageId = str(fd, "packageId");
  const assignedToId = str(fd, "assignedToId");
  const [pkg, assignee] = await Promise.all([
    packageId ? db.servicePackage.findUnique({ where: { id: packageId }, select: { id: true } }) : null,
    assignedToId ? db.user.findFirst({ where: { id: assignedToId, role: { in: ["SUPER_ADMIN", "STAFF"] } }, select: { id: true } }) : null,
  ]);
  await db.invitationProject.update({
    where: { id: project.id },
    data: {
      packageId: pkg?.id ?? null,
      assignedToId: assignee?.id ?? null,
      internalNotes: cleanText(str(fd, "internalNotes")).slice(0, 5000) || null,
    },
  });
  await logActivity(project.id, user.name, "Project details updated");
  revalidateProject(project.id);
  return actionOk("Saved");
}

export async function updateCustomerAction(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { project } = await loadProject(projectId);
  if (!project) return actionError("Project not found.");
  const parsed = readCustomer(fd);
  if (!parsed.success) return actionError("Please check the highlighted fields.", prefixed(fieldErrors(parsed.error), "customer"));
  const c = parsed.data;
  await db.customer.update({
    where: { id: project.customerId },
    data: { name: c.name, email: c.email ?? null, phone: c.phone ?? null, preferredContact: c.preferredContact, locale: c.locale },
  });
  revalidateProject(project.id);
  return actionOk("Customer saved");
}
