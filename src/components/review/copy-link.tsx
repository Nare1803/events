"use client";

import { useState } from "react";

/** Minimal, localized copy-to-clipboard link used on the couple's private pages. */
export function CopyLink({ value, label, copiedLabel, className }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className ?? "inv-link"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
