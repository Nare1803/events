"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

export function CopyButton({ value, label = "Copy link", className, size = "sm" }: { value: string; label?: string; className?: string; size?: "sm" | "md" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }
  return (
    <button type="button" onClick={copy} className={cn(buttonClass("secondary", size), className)} aria-live="polite">
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
    </button>
  );
}
