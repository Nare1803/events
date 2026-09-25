"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Item = { href: string; label: string };

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio" className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/projects") || pathname.startsWith("/admin/events") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-stone-100 text-espresso" : "text-stone-500 hover:text-espresso",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
