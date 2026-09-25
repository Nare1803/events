import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-4 py-12">
      <Link href="/" className="mb-10 font-serif text-3xl tracking-[0.2em] text-espresso">
        {brand.name}
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-espresso">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-6 text-sm text-stone-600">{footer}</p>
    </main>
  );
}
