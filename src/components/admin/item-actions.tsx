"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/actions";
import { notifySaved } from "@/lib/client-events";

type ItemActionsProps = {
  move?: (direction: "up" | "down") => Promise<ActionState>;
  remove: () => Promise<ActionState>;
  confirmText: string;
  isFirst?: boolean;
  isLast?: boolean;
  label: string;
};

/** Reorder / delete controls for list items (schedule, locations, gallery). */
export function ItemActions({ move, remove, confirmText, isFirst, isLast, label }: ItemActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await task();
      setError(result.ok === false ? (result.message ?? "Something went wrong") : null);
      if (result.ok) notifySaved();
    });

  return (
    <div className="flex items-center gap-1">
      {move && (
        <>
          <Button size="sm" variant="ghost" disabled={pending || isFirst} onClick={() => run(() => move("up"))} aria-label={`Move ${label} up`}>
            ↑
          </Button>
          <Button size="sm" variant="ghost" disabled={pending || isLast} onClick={() => run(() => move("down"))} aria-label={`Move ${label} down`}>
            ↓
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="danger-ghost"
        disabled={pending}
        onClick={() => {
          if (window.confirm(confirmText)) run(remove);
        }}
      >
        Delete
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
