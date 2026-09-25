"use client";

import { useState, useTransition } from "react";
import { Button, type ButtonVariant } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/actions";
import { notifySaved } from "@/lib/client-events";
import { cn } from "@/lib/utils/cn";

type ActionButtonProps = {
  action: () => Promise<ActionState>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  confirm?: string;
  pendingLabel?: string;
  className?: string;
};

/** Runs a bound server action on click and shows its result next to the button. */
export function ActionButton({ action, children, variant = "primary", size = "md", confirm, pendingLabel = "Working…", className }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Button
        variant={variant}
        size={size}
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          startTransition(async () => {
            const next = await action();
            setResult(next);
            if (next.ok) notifySaved();
          });
        }}
      >
        {pending ? pendingLabel : children}
      </Button>
      <span aria-live="polite" className={cn("text-xs", result?.ok === false ? "text-red-700" : "text-emerald-700")}>
        {result?.message}
      </span>
    </span>
  );
}
