import { ActionButton } from "@/components/admin/action-button";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField } from "@/components/forms/fields";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { createStaffAction, removeStaffAction, resetStaffPasswordAction } from "@/server/actions/catalogue";

export default async function TeamPage() {
  const me = await requireSuperAdmin();
  const users = await db.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "STAFF"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { assignedProjects: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader title="Team" description="Studio accounts. Customers never need an account — they use their private review link." />
      <Card>
        <ul className="divide-y divide-stone-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {u.name} {u.id === me.id && <span className="text-xs text-stone-400">(you)</span>}
                </p>
                <p className="text-sm text-stone-500">
                  {u.email} · since {formatDateTime(u.createdAt).split(",")[0]} · {u._count.assignedProjects} projects
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={u.role === "SUPER_ADMIN" ? "info" : "neutral"}>{u.role === "SUPER_ADMIN" ? "Super admin" : "Staff"}</Badge>
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 [&::-webkit-details-marker]:hidden">
                    Set password
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
                    <ActionForm action={resetStaffPasswordAction.bind(null, u.id)} className="flex flex-col gap-2" resetOnSuccess>
                      <TextField name="password" label="New password" type="password" autoComplete="new-password" />
                      <SubmitButton size="sm">Set password</SubmitButton>
                    </ActionForm>
                  </div>
                </details>
                {u.id !== me.id && (
                  <ActionButton size="sm" variant="danger-ghost" action={removeStaffAction.bind(null, u.id)} confirm={`Remove ${u.name}'s studio access?`}>
                    Remove
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Add a team member" description="Share the password with them privately; they can sign in at /login." />
        <ActionForm action={createStaffAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
          <TextField name="name" label="Name" required maxLength={80} />
          <TextField name="email" label="Email" type="email" required autoComplete="off" />
          <TextField name="password" label="Temporary password" type="password" required autoComplete="new-password" hint="At least 10 characters." />
          <SelectField name="role" label="Role" defaultValue="STAFF" options={[{ value: "STAFF", label: "Staff" }, { value: "SUPER_ADMIN", label: "Super admin" }]} />
          <div className="sm:col-span-2 flex justify-end">
            <SubmitButton>Add team member</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </main>
  );
}
