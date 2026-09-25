import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { loginAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Studio sign in", robots: { index: false } };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && isStaffRole(user.role)) redirect("/admin");
  return (
    <AuthCard
      title="ORÉ Studio"
      subtitle="Sign in to prepare and publish invitations."
      footer={
        <>
          Planning a celebration?{" "}
          <Link href="/create" className="font-medium text-espresso underline underline-offset-4">
            Request your invitation
          </Link>
        </>
      }
    >
      <ActionForm action={loginAction} className="flex flex-col gap-4">
        <TextField name="email" label="Email" type="email" autoComplete="email" required />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
        <SubmitButton pendingLabel="Signing in…" className="mt-2 w-full">
          Sign in
        </SubmitButton>
      </ActionForm>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-2 rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-600">
          Demo studio account: <span className="font-mono">admin@ore.am</span> / <span className="font-mono">ore-studio-2027</span>
        </p>
      )}
    </AuthCard>
  );
}
