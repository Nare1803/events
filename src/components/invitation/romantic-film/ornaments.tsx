import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/*
 * The Romantic Film ornament kit. Every piece is a flat SVG or CSS shape that
 * takes its colours from the surrounding `.rf-light` / `.rf-dark` screen, and
 * every letter or number on an ornament is HTML text laid over the shape —
 * never SVG text — so it stays live and selectable.
 */

/** Two-digit frame number: 3 → "03". */
export const frameNo = (n: number) => String(n).padStart(2, "0");

/** Screen-edge timecode: 4 → "00:04:00:00". */
export const timecode = (n: number) => `00:${frameNo(n)}:00:00`;

/* Title mark — the film-leader ring ---------------------------------------- */

const R = { outer: 118, second: 94, inner: 62 };
/** Mid-radius and circumference of the band the leader sweep fills. */
const SWEEP_R = (R.second + R.inner) / 2;
const SWEEP_C = 2 * Math.PI * SWEEP_R;

/**
 * The leader ring: outer and second circles, crosshair arms, four ticks and the
 * inner circle that holds the initials. With `count`, the intro version: the
 * sweep turns once per number (3 · 2 · 1, 400ms each), the numbers cross-fade
 * and the initials fade in at 1.2s. Its rest state (no animation) is the final
 * frame, which is what reduced motion shows straight away.
 */
export function LeaderRing({
  initials,
  size = 240,
  count = false,
  className,
}: {
  initials: string[];
  size?: number;
  count?: boolean;
  className?: string;
}) {
  const two = initials.length > 1;
  const arms = [0, 90, 180, 270];
  const ticks = [45, 135, 225, 315];
  return (
    <div className={cn("rf-leader relative shrink-0", count && "is-counting", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
        <g fill="none" stroke="var(--rf-orn)">
          <circle cx={120} cy={120} r={R.outer} strokeWidth={1.5} />
          <circle cx={120} cy={120} r={R.second} strokeWidth={1} opacity={0.6} />
          <circle cx={120} cy={120} r={R.inner} strokeWidth={1} />
          {arms.map((a) => (
            <line key={a} x1={120 + R.inner} y1={120} x2={120 + R.outer} y2={120} strokeWidth={0.75} opacity={0.6} transform={`rotate(${a} 120 120)`} />
          ))}
          {ticks.map((a) => (
            <line key={a} x1={120 + R.second + 6} y1={120} x2={120 + R.outer - 6} y2={120} strokeWidth={1} transform={`rotate(${a} 120 120)`} />
          ))}
        </g>
        {count && (
          <circle
            className="rf-sweep"
            cx={120}
            cy={120}
            r={SWEEP_R}
            fill="none"
            stroke="var(--rf-amber)"
            strokeOpacity={0.28}
            strokeWidth={R.second - R.inner}
            strokeDasharray={SWEEP_C}
            style={{ "--rf-sweep": SWEEP_C } as CSSProperties}
            transform="rotate(-90 120 120)"
          />
        )}
      </svg>
      {/* Live text over the ring: 17% of the ring for two initials, 20% for one, 42% for the count. */}
      {count &&
        ["3", "2", "1"].map((n) => (
          <span key={n} className={`rf-count rf-count-${n} rf-display absolute inset-0 flex items-center justify-center leading-none`} style={{ fontSize: size * 0.42 }} aria-hidden="true">
            {n}
          </span>
        ))}
      <span
        className="rf-initials rf-display absolute inset-0 flex items-center justify-center leading-none tracking-[0.02em]"
        style={{ fontSize: size * (two ? 0.17 : 0.2) }}
        aria-hidden="true"
      >
        {initials[0]}
        {two && (
          <>
            <span className="rf-amp mx-[0.06em] text-[0.8em]">&amp;</span>
            {initials[1]}
          </>
        )}
      </span>
    </div>
  );
}

/* Divider — three sprocket holes on a hairline ---------------------------- */

export function Divider({ width = 180, className }: { width?: number; className?: string }) {
  const mid = width / 2;
  return (
    <svg viewBox={`0 0 ${width} 10`} width={width} height={10} className={cn("block max-w-full", className)} aria-hidden="true" focusable="false">
      <g stroke="var(--rf-orn)" strokeWidth={1}>
        <line x1={0} y1={5} x2={mid - 18} y2={5} opacity={0.55} />
        <line x1={mid + 18} y1={5} x2={width} y2={5} opacity={0.55} />
        <rect x={mid - 13.5} y={1.5} width={5} height={7} rx={1} fill="none" />
        <rect x={mid - 2.5} y={1.5} width={5} height={7} rx={1} fill="var(--rf-rose)" stroke="var(--rf-rose)" />
        <rect x={mid + 8.5} y={1.5} width={5} height={7} rx={1} fill="none" />
      </g>
    </svg>
  );
}

/* Sprocket rows ------------------------------------------------------------ */

/** A row of 6 × 8px rounded holes every 14px (CSS mask, colour from --rf-hole). */
export function Sprockets({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  return <span className={cn(vertical ? "rf-sprockets-y" : "rf-sprockets", className)} aria-hidden="true" />;
}

/**
 * The vertical sprocket bands down both sides of the intro and the closing.
 * Purely decorative; content keeps 28px clear of them.
 */
export function SprocketEdges() {
  return (
    <>
      <span className="rf-edge left-0" aria-hidden="true">
        <Sprockets vertical />
      </span>
      <span className="rf-edge right-0" aria-hidden="true">
        <Sprockets vertical />
      </span>
    </>
  );
}

/** A night band with sprocket rows above and below its content (countdown, gallery). */
export function FilmStrip({ children, className, inner }: { children: ReactNode; className?: string; inner?: string }) {
  return (
    <div className={cn("rf-strip", className)}>
      <Sprockets />
      <div className={cn("py-2", inner)}>{children}</div>
      <Sprockets />
    </div>
  );
}

/* Frame corners ------------------------------------------------------------ */

/**
 * Four L-shaped corner marks, 1.5px. `offset` > 0 sets them outside the parent
 * (stills), < 0 inside it (the dress-code still, the intertitle frame).
 */
export function FrameCorners({ arm = 18, offset = 10, className }: { arm?: number; offset?: number; className?: string }) {
  const style = { "--rf-arm": `${arm}px`, "--rf-off": `${-offset}px` } as CSSProperties;
  return (
    <span className={cn("pointer-events-none absolute inset-0", className)} style={style} aria-hidden="true">
      <span className="rf-corner rf-corner-tl" />
      <span className="rf-corner rf-corner-tr" />
      <span className="rf-corner rf-corner-bl" />
      <span className="rf-corner rf-corner-br" />
    </span>
  );
}

/* Label rule --------------------------------------------------------------- */

/**
 * "[04] —— COUNTDOWN": the screen's frame number in a box, a short hairline,
 * then the section label in tracked capitals (Armenian keeps its own case).
 * The label is the heading unless the screen has its own title.
 */
export function LabelRule({
  n,
  label,
  id,
  as: Tag = "p",
  center = false,
  className,
}: {
  n: number;
  label: string;
  id?: string;
  as?: ElementType;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", center && "justify-center", className)}>
      <span className="rf-frame-box" aria-hidden="true">
        {frameNo(n)}
      </span>
      <span className="h-px w-[22px] bg-[var(--rf-label)] opacity-60" aria-hidden="true" />
      <Tag id={id} className="rf-eyebrow">
        {label}
      </Tag>
    </div>
  );
}

/** "04 · 00:04:00:00" at the foot of a screen. Decorative. */
export function EdgeCode({ n, className }: { n: number; className?: string }) {
  return (
    <p className={cn("rf-edge-code", className)} aria-hidden="true">
      {frameNo(n)} · {timecode(n)}
    </p>
  );
}

/* Small icons -------------------------------------------------------------- */

export function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 14" width={11} height={13} className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <path d="M6 13 C6 13 1.2 8.4 1.2 5.2 A4.8 4.8 0 0 1 10.8 5.2 C10.8 8.4 6 13 6 13 Z" fill="none" stroke="currentColor" strokeWidth={1.2} />
      <circle cx={6} cy={5.2} r={1.6} fill="none" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <circle cx={10} cy={10} r={9} fill="none" stroke="currentColor" strokeWidth={1.2} />
      <path d="M8.2 6.6 L13.6 10 L8.2 13.4 Z" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" width={14} height={9} className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <path d="M1.5 1.5 L8 8 L14.5 1.5" fill="none" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  );
}
