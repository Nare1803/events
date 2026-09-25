"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { hashPassword } from "@/lib/auth/password";
import { requireStaff, requireSuperAdmin } from "@/lib/auth/session";
import { bool, str } from "@/lib/forms";
import { slugify } from "@/lib/utils/slug";
import { fieldErrors, optionalText, requiredLine } from "@/lib/validation/common";
import { packageSchema } from "@/lib/validation/project";
import { cleanLine } from "@/lib/validation/sanitize";

function readPackage(fd: FormData) {
  return packageSchema.safeParse({
    name: str(fd, "name"),
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    features: str(fd, "features"),
    includedRevisions: str(fd, "includedRevisions").trim(),
    priceAmount: str(fd, "priceAmount").trim(),
    currency: str(fd, "currency") || "AMD",
    sortOrder: str(fd, "sortOrder") || "0",
  });
}

function packageData(p: z.infer<typeof packageSchema>, fd: FormData) {
  const features = p.features
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 12);
  return {
    name: p.name,
    tagline: p.tagline,
    description: p.description ?? "",
    features: JSON.stringify(features),
    includedRevisions: p.includedRevisions === "" ? null : p.includedRevisions,
    priceAmount: p.priceAmount === "" ? null : p.priceAmount,
    currency: p.currency,
    sortOrder: p.sortOrder,
    active: bool(fd, "active"),
    isDefault: bool(fd, "isDefault"),
  };
}

function refreshCatalogue() {
  revalidatePath("/admin/packages");
  revalidatePath("/admin/templates");
  revalidatePath("/", "layout");
}

export async function savePackageAction(packageId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = readPackage(fd);
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const data = packageData(parsed.data, fd);

  await db.$transaction(async (tx) => {
    if (data.isDefault) await tx.servicePackage.updateMany({ where: packageId ? { id: { not: packageId } } : {}, data: { isDefault: false } });
    if (packageId) {
      await tx.servicePackage.update({ where: { id: packageId }, data });
    } else {
      let key = slugify(data.name, 30) || "package";
      if (await tx.servicePackage.findUnique({ where: { key } })) key = `${key}-${Date.now().toString(36)}`;
      await tx.servicePackage.create({ data: { ...data, key } });
    }
  });
  refreshCatalogue();
  return actionOk(packageId ? "Package saved" : "Package created");
}

const templateSchema = z.object({ name: requiredLine(60), description: optionalText(300), sortOrder: z.coerce.number().int().min(0).max(999) });

export async function saveTemplateAction(templateId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = templateSchema.safeParse({ name: str(fd, "name"), description: str(fd, "description"), sortOrder: str(fd, "sortOrder") || "0" });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  await db.template.update({
    where: { id: templateId },
    data: { name: parsed.data.name, description: parsed.data.description ?? "", sortOrder: parsed.data.sortOrder, isPublic: bool(fd, "isPublic") },
  });
  refreshCatalogue();
  return actionOk("Template saved");
}

// --- Team (super admin only) ------------------------------------------------

const staffSchema = z.object({
  name: requiredLine(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  role: z.enum(["STAFF", "SUPER_ADMIN"]),
});

export async function createStaffAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = staffSchema.safeParse({ name: str(fd, "name"), email: str(fd, "email"), password: str(fd, "password"), role: str(fd, "role") || "STAFF" });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const exists = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return actionError("This email already has an account.", { email: "Already in use" });
  await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
  });
  revalidatePath("/admin/team");
  return actionOk(`${parsed.data.name} can now sign in`);
}

export async function removeStaffAction(userId: string): Promise<ActionState> {
  const me = await requireSuperAdmin();
  if (userId === me.id) return actionError("You can't remove your own account.");
  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return actionError("Account not found.");
  if (target.role === "SUPER_ADMIN" && (await db.user.count({ where: { role: "SUPER_ADMIN" } })) <= 1) {
    return actionError("At least one super admin must remain.");
  }
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/team");
  return actionOk("Account removed");
}

const passwordSchema = z.object({ password: z.string().min(10, "Use at least 10 characters").max(200) });

export async function resetStaffPasswordAction(userId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = passwordSchema.safeParse({ password: str(fd, "password") });
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
  return actionOk("Password changed — existing sessions were signed out");
}
