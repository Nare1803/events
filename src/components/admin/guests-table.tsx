"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Badge, Button, buttonClass, EmptyState, Input, Select } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/actions";
import { notifySaved } from "@/lib/client-events";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils/cn";
import {
  createGuestAction,
  deleteGuestAction,
  deleteRsvpAction,
  regenerateGuestLinkAction,
  setInviteSentAction,
  updateGuestAction,
} from "@/server/actions/guests";
import { GuestDialog } from "./guest-dialog";
import type { GuestRow } from "./guest-types";

type Filter = "all" | "attending" | "declined" | "awaiting" | "opened" | "unopened" | "unsent";
type Sort = "name" | "updated" | "opened" | "status";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All guests" },
  { value: "attending", label: "Attending" },
  { value: "declined", label: "Declined" },
  { value: "awaiting", label: "Awaiting response" },
  { value: "opened", label: "Opened" },
  { value: "unopened", label: "Not opened" },
  { value: "unsent", label: "Not sent yet" },
];

function matches(guest: GuestRow, filter: Filter): boolean {
  switch (filter) {
    case "attending":
      return guest.rsvp === "ATTENDING";
    case "declined":
      return guest.rsvp === "DECLINED";
    case "awaiting":
      return guest.rsvp === null;
    case "opened":
      return guest.openedAt !== null;
    case "unopened":
      return guest.openedAt === null;
    case "unsent":
      return !guest.sent;
    default:
      return true;
  }
}

const STATUS_ORDER = { ATTENDING: 0, DECLINED: 1, null: 2 } as const;

function RsvpBadge({ guest }: { guest: GuestRow }) {
  if (guest.rsvp === "ATTENDING") return <Badge tone="info">Attending · {guest.guestCount}</Badge>;
  if (guest.rsvp === "DECLINED") return <Badge tone="warning">Declined</Badge>;
  return <Badge>Awaiting</Badge>;
}

function whatsappUrl(guest: GuestRow, coupleNames: string) {
  const text = `${coupleNames}\n${guest.url}`;
  const phone = guest.phone?.replace(/[^\d]/g, "");
  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(text)}`;
}

type GuestsTableProps = { eventId: string; guests: GuestRow[]; locales: Locale[]; defaultAllowed: number; coupleNames: string };

export function GuestsTable({ eventId, guests, locales, defaultAllowed, coupleNames }: GuestsTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<GuestRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<ActionState | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = guests.filter(
      (g) => matches(g, filter) && (!q || [g.name, g.phone, g.email, g.slug].some((v) => v?.toLowerCase().includes(q))),
    );
    return [...list].sort((a, b) => {
      if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      if (sort === "opened") return (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? "");
      if (sort === "status") return STATUS_ORDER[`${a.rsvp}`] - STATUS_ORDER[`${b.rsvp}`] || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [guests, query, filter, sort]);

  const allVisibleSelected = visible.length > 0 && visible.every((g) => selected.has(g.id));

  function run(task: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await task();
      setNotice(result);
      if (result.ok) notifySaved();
    });
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copy(guest: GuestRow) {
    try {
      await navigator.clipboard.writeText(guest.url);
      setCopiedId(guest.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setNotice({ ok: false, message: "Couldn't access the clipboard — copy the link from the edit dialog." });
    }
  }

  const openDialog = (guest: GuestRow | null) => {
    setEditing(guest);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="guest-search">
          Search guests
        </label>
        <Input id="guest-search" type="search" placeholder="Search name, phone, email…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-72" />
        <div className="w-[calc(50%-0.25rem)] sm:w-44">
        <label className="sr-only" htmlFor="guest-filter">
          Filter
        </label>
        <Select id="guest-filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        </div>
        <div className="w-[calc(50%-0.25rem)] sm:w-48">
        <label className="sr-only" htmlFor="guest-sort">
          Sort
        </label>
        <Select id="guest-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: RSVP status</option>
          <option value="updated">Sort: Last updated</option>
          <option value="opened">Sort: Last opened</option>
        </Select>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/admin/events/${eventId}/guests/import`} className={buttonClass("secondary")}>
            Import
          </Link>
          <a href={`/admin/events/${eventId}/rsvps/export`} className={buttonClass("secondary")}>
            Export CSV
          </a>
          <Button onClick={() => openDialog(null)}>Add guest</Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-stone-100 px-4 py-2 text-sm">
          <span>{selected.size} selected</span>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setInviteSentAction(eventId, [...selected], true))}>
            Mark as sent
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setInviteSentAction(eventId, [...selected], false))}>
            Mark as not sent
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      <p aria-live="polite" className={cn("min-h-5 text-sm", notice?.ok === false ? "text-red-700" : "text-emerald-700")}>
        {notice?.message}
      </p>

      {guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests one by one or import a CSV/Excel list. Each guest gets their own personal invitation link."
          action={<Button onClick={() => openDialog(null)}>Add your first guest</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">Guests ({visible.length} shown)</caption>
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all visible guests"
                    checked={allVisibleSelected}
                    onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((g) => g.id)))}
                    className="h-4 w-4 accent-espresso"
                  />
                </th>
                <th scope="col" className="px-3 py-3 font-medium">Guest</th>
                <th scope="col" className="px-3 py-3 font-medium">Personal link</th>
                <th scope="col" className="px-3 py-3 font-medium">Allowed</th>
                <th scope="col" className="px-3 py-3 font-medium">Invitation</th>
                <th scope="col" className="px-3 py-3 font-medium">RSVP</th>
                <th scope="col" className="px-3 py-3 font-medium">Updated</th>
                <th scope="col" className="px-3 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((guest) => (
                <tr key={guest.id} className="align-top hover:bg-stone-50/60">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${guest.name}`}
                      checked={selected.has(guest.id)}
                      onChange={() => toggle(guest.id)}
                      className="h-4 w-4 accent-espresso"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-espresso">{guest.name}</p>
                    <p className="text-xs text-stone-500">{[guest.phone, guest.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                    {guest.source === "PUBLIC_RSVP" && <p className="mt-1 text-xs text-stone-400">Responded via public link</p>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <code className="max-w-40 truncate rounded bg-stone-100 px-1.5 py-0.5 text-xs" title={guest.url}>
                        /{guest.slug}
                      </code>
                      <button type="button" onClick={() => copy(guest)} className="text-xs font-medium text-espresso underline underline-offset-2">
                        {copiedId === guest.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{guest.allowedGuests}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={guest.sent ? "success" : "neutral"}>{guest.sent ? "Sent" : "Not sent"}</Badge>
                      <span className="text-xs text-stone-500">
                        {guest.openedAt ? `Opened ${guest.labels.opened}${guest.openCount > 1 ? ` · ${guest.openCount}×` : ""}` : "Not opened"}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-52 px-3 py-3">
                    <RsvpBadge guest={guest} />
                    {guest.transport != null && <p className="mt-1 text-xs text-stone-500">Transport: {guest.transport ? "yes" : "no"}</p>}
                    {guest.dietary && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">Dietary: {guest.dietary}</p>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-stone-500">{guest.labels.updated}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openDialog(guest)}>
                        Edit
                      </Button>
                      <details className="relative">
                        <summary className={cn(buttonClass("ghost", "sm"), "list-none [&::-webkit-details-marker]:hidden")} aria-label={`More actions for ${guest.name}`}>
                          •••
                        </summary>
                        <div className="absolute right-0 z-20 mt-1 flex w-52 flex-col rounded-lg border border-stone-200 bg-white p-1 text-sm shadow-lg">
                          <a href={guest.url} target="_blank" rel="noopener noreferrer" className="rounded px-3 py-2 hover:bg-stone-100">
                            Open invitation
                          </a>
                          <a href={whatsappUrl(guest, coupleNames)} target="_blank" rel="noopener noreferrer" className="rounded px-3 py-2 hover:bg-stone-100">
                            Share via WhatsApp
                          </a>
                          <button type="button" className="rounded px-3 py-2 text-left hover:bg-stone-100" onClick={() => run(() => setInviteSentAction(eventId, [guest.id], !guest.sent))}>
                            {guest.sent ? "Mark as not sent" : "Mark as sent"}
                          </button>
                          <button
                            type="button"
                            className="rounded px-3 py-2 text-left hover:bg-stone-100"
                            onClick={() => {
                              if (window.confirm(`Create a new link for ${guest.name}? The current link will stop working.`)) run(() => regenerateGuestLinkAction(eventId, guest.id));
                            }}
                          >
                            Create new link
                          </button>
                          {guest.rsvp && (
                            <button
                              type="button"
                              className="rounded px-3 py-2 text-left hover:bg-stone-100"
                              onClick={() => {
                                if (window.confirm(`Clear ${guest.name}'s response so they can answer again?`)) run(() => deleteRsvpAction(eventId, guest.id));
                              }}
                            >
                              Clear response
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded px-3 py-2 text-left text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(`Delete ${guest.name} and their response? This cannot be undone.`)) run(() => deleteGuestAction(eventId, guest.id));
                            }}
                          >
                            Delete guest
                          </button>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-stone-500">
                    No guests match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <GuestDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        guest={editing}
        locales={locales}
        defaultAllowed={defaultAllowed}
        action={editing ? updateGuestAction.bind(null, eventId, editing.id) : createGuestAction.bind(null, eventId)}
      />
    </div>
  );
}
