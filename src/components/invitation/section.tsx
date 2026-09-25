import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "./reveal";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  tone?: "base" | "surface" | "inverse";
  className?: string;
  children: ReactNode;
};

const TONES = {
  base: "bg-inv-bg text-inv-text",
  surface: "bg-inv-surface text-inv-text",
  inverse: "bg-inv-inverse-bg text-inv-inverse-text",
};

export function Section({ id, eyebrow, title, tone = "base", className, children }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn("inv-section px-6 sm:px-10", TONES[tone], className)}>
      {(eyebrow || title) && (
        <Reveal className="mx-auto mb-14 max-w-3xl text-center sm:mb-20">
          {eyebrow && <p className="inv-eyebrow text-inv-accent">{eyebrow}</p>}
          {title && (
            <h2 id={headingId} className="inv-display mt-5 text-[2.75rem] sm:text-6xl">
              {title}
            </h2>
          )}
        </Reveal>
      )}
      {children}
    </section>
  );
}

/** Preserves intentional line breaks from couple-authored text. */
export function Multiline({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}
