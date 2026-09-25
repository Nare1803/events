"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/** Ordered like the studio workflow: content first, guests and results last. */
const ITEMS = [
  { href: "/invitation", label: "Content" },
  { href: "/gallery", label: "Gallery" },
  { href: "/music", label: "Music" },
  { href: "/schedule", label: "Schedule" },
  { href: "/locations", label: "Locations" },
  { href: "/design", label: "Template" },
  { href: "/settings", label: "RSVP & settings" },
  { href: "/guests", label: "Guests" },
  { href: "/rsvps", label: "Responses" },
  { href: "", label: "Results" },
];

/** Sidebar on desktop, horizontally scrollable tabs on mobile. */
export function EventNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/admin/events/${eventId}`;
  return (
    <nav aria-label="Event sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <li key={item.label} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-espresso text-ivory" : "text-stone-600 hover:bg-stone-200/60 hover:text-espresso",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
