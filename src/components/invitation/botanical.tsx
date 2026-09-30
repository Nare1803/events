import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

/** Paired leaves along a stem, mirrored above and below. `x` is where the leaf starts. */
function LeafPair({ x, dir, size = 1 }: { x: number; dir: 1 | -1; size?: number }) {
  const l = 14 * size * dir;
  const w = 7 * size;
  return (
    <>
      <path d={`M${x} 20 C ${x + l * 0.3} ${20 - w}, ${x + l * 0.8} ${20 - w * 1.1}, ${x + l} ${20 - w * 1.3} C ${x + l * 0.7} ${20 - w * 0.4}, ${x + l * 0.35} 20, ${x} 20 Z`} />
      <path d={`M${x} 20 C ${x + l * 0.3} ${20 + w}, ${x + l * 0.8} ${20 + w * 1.1}, ${x + l} ${20 + w * 1.3} C ${x + l * 0.7} ${20 + w * 0.4}, ${x + l * 0.35} 20, ${x} 20 Z`} />
    </>
  );
}

/**
 * A hand-drawn botanical sprig used by the Modern Garden template as a divider.
 * Drawn with `currentColor`, so it follows whatever text colour surrounds it.
 */
export function Sprig({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 160 40" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" className={cn("h-8 w-40", className)} style={style} aria-hidden="true">
      <path d="M8 20 C 40 18, 60 20, 80 20 C 100 20, 120 22, 152 20" />
      <LeafPair x={62} dir={-1} size={1.1} />
      <LeafPair x={44} dir={-1} />
      <LeafPair x={28} dir={-1} size={0.8} />
      <LeafPair x={98} dir={1} size={1.1} />
      <LeafPair x={116} dir={1} />
      <LeafPair x={132} dir={1} size={0.8} />
      <circle cx="80" cy="20" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A short vertical stem with two leaves, used to join stacked garden cards. */
export function Stem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 56" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" className={cn("h-14 w-6", className)} aria-hidden="true">
      <path d="M12 0 V56" />
      <path d="M12 30 C 8 27, 5 22, 4 17 C 9 19, 11 24, 12 30 Z" />
      <path d="M12 22 C 16 19, 19 14, 20 9 C 15 11, 13 16, 12 22 Z" />
    </svg>
  );
}
