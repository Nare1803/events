import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { brand } from "@/config/brand";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const items = [
    { href: "/admin", label: "Projects" },
    { href: "/admin/packages", label: "Packages" },
    { href: "/admin/templates", label: "Templates" },
    ...(isSuperAdmin(user.role) ? [{ href: "/admin/team", label: "Team" }] : []),
  ];
  return (
    <div className="min-h-dvh bg-stone-50 text-espresso">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="shrink-0 font-serif text-xl tracking-[0.2em]">
            {brand.name}
            <span className="ml-2 align-middle font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">Studio</span>
          </Link>
          <div className="min-w-0 flex-1">
            <AdminNav items={items} />
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden text-stone-500 md:inline">{user.name}</span>
            <form action={logoutAction}>
              <button type="submit" className="rounded-md px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
