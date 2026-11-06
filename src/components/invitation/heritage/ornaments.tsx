import type { CSSProperties, ElementType, ReactNode } from "react";
import { ornamentColors, type OrnamentTone } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";

/**
 * Armenian Heritage ornament kit. Every piece is a plain SVG drawn from the
 * Heritage palette (light or dark tone), decorative and hidden from assistive
 * technology. None of them use hooks, so they render in server and client
 * components alike.
 */

type Size = number | string;
const hidden = { "aria-hidden": true, focusable: "false" } as const;

/* ---------------------------------------------------------------------------
 * Small shapes reused inside the larger ornaments
 * ------------------------------------------------------------------------ */

/** Eight-point star: two overlapping squares, centred on (0, 0). */
function Star({ r, fill }: { r: number; fill: string }) {
  const s = r * 0.72;
  return (
    <g fill={fill}>
      <rect x={-s} y={-s} width={s * 2} height={s * 2} />
      <rect x={-s} y={-s} width={s * 2} height={s * 2} transform="rotate(45)" />
    </g>
  );
}

/** A diamond centred on (0, 0). */
function Lozenge({ w, h, fill, stroke, strokeWidth }: { w: number; h: number; fill: string; stroke?: string; strokeWidth?: number }) {
  return <path d={`M0 ${-h} L${w} 0 L0 ${h} L${-w} 0 Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

/** Places children at a point given in percentages (or px) of the parent SVG. */
function At({ x, y, children }: { x: Size; y: Size; children: ReactNode }) {
  return (
    <svg x={x} y={y} overflow="visible">
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 1. Frame — the manuscript page border behind every section
 * ------------------------------------------------------------------------ */

/**
 * A rule `inset` px from every edge. SVG can't say "100% − 10px", so each line
 * runs to a percentage end point and a transform pulls it back by the inset.
 */
function Rule({ inset: i, stroke, width, opacity }: { inset: number; stroke: string; width: number; opacity?: number }) {
  return (
    <g stroke={stroke} strokeWidth={width} opacity={opacity} fill="none">
      <line x1={2 * i} y1={i} x2="100%" y2={i} transform={`translate(${-i} 0)`} />
      <line x1={2 * i} y1="100%" x2="100%" y2="100%" transform={`translate(${-i} ${-i})`} />
      <line x1={i} y1={2 * i} x2={i} y2="100%" transform={`translate(0 ${-i})`} />
      <line x1="100%" y1={2 * i} x2="100%" y2="100%" transform={`translate(${-i} ${-i})`} />
    </g>
  );
}

const RULES = { ink: 10.5, gold: 17, red: 23.5 } as const;

/**
 * Three inset rules (ink at 10px, gold at 17px, pomegranate at 23px), corner
 * medallions, a finial at top and bottom centre and diamonds at the side
 * midpoints. Fills its container by default; content should keep ≥ 40px of
 * padding so the ornament never sits behind text.
 */
export function Frame({
  width = "100%",
  height = "100%",
  tone = "light",
  className,
}: {
  width?: Size;
  height?: Size;
  tone?: OrnamentTone;
  className?: string;
}) {
  const c = ornamentColors(tone);

  const medallion = (
    <g>
      <circle r={9.5} fill={c.ground} stroke={c.gold} strokeWidth={1} />
      <Star r={6} fill={c.red} />
      <circle r={1.6} fill={c.ground} />
    </g>
  );

  // Drawn with its top edge at y = 0 and centred on x = 0; mirrored for the bottom.
  const finial = (
    <g>
      <rect x={-27} y={6} width={54} height={22} fill={c.ground} />
      <path d="M-10 17 C-14 11, -21 10, -26 14 C-22 15.5, -19 17, -22 20.5 C-17 21.5, -13 20, -10 17 Z" fill={c.gold} />
      <path d="M10 17 C14 11, 21 10, 26 14 C22 15.5, 19 17, 22 20.5 C17 21.5, 13 20, 10 17 Z" fill={c.gold} />
      <g transform="translate(0 17)">
        <Lozenge w={9} h={11} fill={c.red} />
        <Lozenge w={4.5} h={6} fill={c.ground} stroke={c.gold} strokeWidth={1} />
      </g>
      <circle cy={3} r={2.4} fill={c.gold} />
    </g>
  );

  const sideDiamond = (
    <g>
      <rect x={-9} y={-8} width={18} height={16} fill={c.ground} />
      <Lozenge w={5} h={7} fill={c.red} stroke={c.gold} strokeWidth={1} />
    </g>
  );

  return (
    <svg width={width} height={height} className={cn("pointer-events-none", className)} {...hidden}>
      <Rule inset={RULES.ink} stroke={c.ink} width={1} opacity={tone === "dark" ? 0.45 : 0.75} />
      <Rule inset={RULES.gold} stroke={c.gold} width={1.5} />
      <Rule inset={RULES.red} stroke={c.red} width={1} />

      <At x={0} y={0}>
        <g transform={`translate(${RULES.gold} ${RULES.gold})`}>{medallion}</g>
      </At>
      <At x="100%" y={0}>
        <g transform={`translate(${-RULES.gold} ${RULES.gold})`}>{medallion}</g>
      </At>
      <At x={0} y="100%">
        <g transform={`translate(${RULES.gold} ${-RULES.gold})`}>{medallion}</g>
      </At>
      <At x="100%" y="100%">
        <g transform={`translate(${-RULES.gold} ${-RULES.gold})`}>{medallion}</g>
      </At>

      <At x="50%" y={0}>
        {finial}
      </At>
      <At x="50%" y="100%">
        <g transform="scale(1 -1)">{finial}</g>
      </At>

      <At x={0} y="50%">
        <g transform={`translate(${RULES.gold} 0)`}>{sideDiamond}</g>
      </At>
      <At x="100%" y="50%">
        <g transform={`translate(${-RULES.gold} 0)`}>{sideDiamond}</g>
      </At>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 2. Monogram — the couple's initials under two birds and a pomegranate
 * ------------------------------------------------------------------------ */

/** A small bird facing right, standing on the medallion's upper-left arc. */
function Bird({ body, wing, ground }: { body: string; wing: string; ground: string }) {
  return (
    <g>
      {/* tail feathers */}
      <path d="M56 97 L41 106 L47 98.5 L37 97 L49 93.5 Z" fill={body} />
      <path d="M78 79 C87 81, 89 90, 83 96 C77 101.5, 66 101.5, 57 98.5 C55 95, 58 88, 64 84 C69 81, 73 79.5, 78 79 Z" fill={body} />
      <circle cx={82} cy={75} r={6} fill={body} />
      <path d="M87.5 73.4 L95.2 76.2 L87.5 78.6 Z" fill={wing} />
      <circle cx={84} cy={74} r={1.15} fill={ground} />
      {/* gold wing with two feather lines */}
      <path d="M81 84 C75 80.5, 64 83, 56.5 92.5 C65 94.5, 75 92.5, 81 84 Z" fill={wing} />
      <path d="M74 86 L64 90.5 M70 85.2 L61 89" stroke={ground} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

/**
 * The couple's initials (from their Armenian names, e.g. Ա և Դ) in a round
 * medallion with a dotted gold ring. Two birds face each other above it,
 * pecking a pomegranate — one pomegranate red, one ink, both with gold wings —
 * and a gold pendant hangs below. `size` is the width; the height is 1.25×.
 */
export function Monogram({
  size = 200,
  tone = "light",
  initials,
  className,
  style,
}: {
  size?: number;
  tone?: OrnamentTone;
  initials: string[];
  className?: string;
  style?: CSSProperties;
}) {
  const c = ornamentColors(tone);
  const letter = { fontFamily: "var(--font-display-hy), var(--font-display), serif", fontWeight: 300 } as const;
  const [one, two] = initials;

  return (
    <svg viewBox="0 0 200 250" width={size} height={size * 1.25} className={className} style={style} {...hidden}>
      {/* medallion */}
      <circle cx={100} cy={150} r={58} fill={c.ground} stroke={c.red} strokeWidth={1.5} />
      <circle cx={100} cy={150} r={52} fill="none" stroke={c.gold} strokeWidth={2.6} strokeDasharray="0 6.81" strokeLinecap="round" />
      <circle cx={100} cy={150} r={45.5} fill="none" stroke={c.gold} strokeWidth={0.9} />
      <g transform="translate(36 150)">
        <Lozenge w={3.5} h={5} fill={c.gold} />
      </g>
      <g transform="translate(164 150)">
        <Lozenge w={3.5} h={5} fill={c.gold} />
      </g>

      {two ? (
        <>
          <text x={75} y={164} textAnchor="middle" fontSize={40} fill={c.red} style={letter}>
            {one}
          </text>
          <text x={100} y={158} textAnchor="middle" fontSize={17} fill={c.gold} style={letter}>
            և
          </text>
          <text x={125} y={164} textAnchor="middle" fontSize={40} fill={c.red} style={letter}>
            {two}
          </text>
        </>
      ) : (
        <text x={100} y={168} textAnchor="middle" fontSize={52} fill={c.red} style={letter}>
          {one}
        </text>
      )}

      {/* birds and the pomegranate they peck */}
      <Bird body={c.red} wing={c.gold} ground={c.ground} />
      <g transform="translate(200 0) scale(-1 1)">
        <Bird body={c.ink} wing={c.gold} ground={c.ground} />
      </g>
      <circle cx={100} cy={70} r={7.5} fill={c.red} />
      <path d="M96.6 64 L96.8 59 L98.9 61.6 L100 57.8 L101.1 61.6 L103.2 59 L103.4 64 Z" fill={c.gold} />
      <circle cx={97.4} cy={68.6} r={1.6} fill={c.ground} opacity={0.35} />

      {/* pendant */}
      <path d="M100 208 V214.5" stroke={c.gold} strokeWidth={1.2} />
      <g transform="translate(100 220.5)">
        <Lozenge w={5} h={6} fill={c.gold} />
        <circle r={1.4} fill={c.ground} />
      </g>
      <path d="M100 228.5 C104.6 234.5, 104.6 239.5, 100 242.5 C95.4 239.5, 95.4 234.5, 100 228.5 Z" fill={c.red} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 3. Rosette — eight-point star
 * ------------------------------------------------------------------------ */

export function Rosette({ size = 14, color, className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg viewBox="-10 -10 20 20" width={size} height={size} className={className} {...hidden}>
      <Star r={10} fill={color ?? ornamentColors("light").gold} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 4. Corner — L-shaped corner ornament
 * ------------------------------------------------------------------------ */

/** Drawn for the top-left corner; `rotation` turns it clockwise for the others. */
export function Corner({
  size = 34,
  rotation = 0,
  tone = "light",
  className,
}: {
  size?: number;
  rotation?: 0 | 90 | 180 | 270;
  tone?: OrnamentTone;
  className?: string;
}) {
  const c = ornamentColors(tone);
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} {...hidden}>
      <g transform={`rotate(${rotation} 20 20)`}>
        <path d="M6 35 V6 H35" fill="none" stroke={c.gold} strokeWidth={1.5} />
        <path d="M11.5 25 V11.5 H25" fill="none" stroke={c.red} strokeWidth={1} />
        <circle cx={35} cy={6} r={2} fill={c.gold} />
        <circle cx={6} cy={35} r={2} fill={c.gold} />
        <path d="M25 11.5 C28 9, 31 10.5, 30 13.5" fill="none" stroke={c.red} strokeWidth={1} strokeLinecap="round" />
        <path d="M11.5 25 C9 28, 10.5 31, 13.5 30" fill="none" stroke={c.red} strokeWidth={1} strokeLinecap="round" />
        <g transform="translate(6 6)">
          <Lozenge w={4.5} h={4.5} fill={c.red} stroke={c.gold} strokeWidth={1} />
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 5. Divider — a gold line with a centre star or knot and leaf ends
 * ------------------------------------------------------------------------ */

const lemniscate = (cx: number, cy: number, w: number, h: number) =>
  `M${cx - w} ${cy} C${cx - w} ${cy - h}, ${cx - 2} ${cy - h}, ${cx} ${cy} C${cx + 2} ${cy + h}, ${cx + w} ${cy + h}, ${cx + w} ${cy} C${cx + w} ${cy - h}, ${cx + 2} ${cy - h}, ${cx} ${cy} C${cx - 2} ${cy + h}, ${cx - w} ${cy + h}, ${cx - w} ${cy} Z`;

/** Scales down with its container (never wider than 100%). */
export function Divider({
  width = 240,
  variant = "star",
  tone = "light",
  className,
}: {
  width?: number;
  variant?: "star" | "knot";
  tone?: OrnamentTone;
  className?: string;
}) {
  const c = ornamentColors(tone);
  const mid = width / 2;
  const gap = variant === "knot" ? 22 : 17;
  return (
    <svg viewBox={`0 0 ${width} 24`} width={width} height={24} className={cn("h-auto max-w-full", className)} {...hidden}>
      <path d="M2 12 C6 6.5, 12 6.5, 16 12 C12 17.5, 6 17.5, 2 12 Z" fill={c.gold} />
      <path d={`M${width - 2} 12 C${width - 6} 6.5, ${width - 12} 6.5, ${width - 16} 12 C${width - 12} 17.5, ${width - 6} 17.5, ${width - 2} 12 Z`} fill={c.gold} />
      <g stroke={c.gold} strokeWidth={1}>
        <line x1={18} y1={12} x2={mid - gap} y2={12} />
        <line x1={mid + gap} y1={12} x2={width - 18} y2={12} />
      </g>
      {variant === "star" ? (
        <g transform={`translate(${mid} 12)`}>
          <Star r={9} fill={c.red} />
          <circle r={2} fill={c.ground} />
          <g transform="translate(-13 0)">
            <Lozenge w={2.5} h={3.5} fill={c.gold} />
          </g>
          <g transform="translate(13 0)">
            <Lozenge w={2.5} h={3.5} fill={c.gold} />
          </g>
        </g>
      ) : (
        <g fill="none" strokeLinecap="round">
          {/* Two interlaced figure-of-eight loops; a ground-coloured halo makes one pass over the other. */}
          <path d={lemniscate(mid, 12, 17, 9)} stroke={c.gold} strokeWidth={1.4} />
          <g transform={`rotate(90 ${mid} 12)`}>
            <path d={lemniscate(mid, 12, 10.5, 6.5)} stroke={c.ground} strokeWidth={4} />
            <path d={lemniscate(mid, 12, 10.5, 6.5)} stroke={c.red} strokeWidth={1.2} />
          </g>
          <circle cx={mid} cy={12} r={1.6} fill={c.gold} stroke="none" />
        </g>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 6. CarpetBand — a repeating hooked-diamond carpet strip, 40px tall
 * ------------------------------------------------------------------------ */

const TILE = 36;

function CarpetTile({ cx, main, gold, ground }: { cx: number; main: string; gold: string; ground: string }) {
  return (
    <g>
      <path d={`M${cx} 9 L${cx + 11} 20 L${cx} 31 L${cx - 11} 20 Z`} fill={main} />
      <path d={`M${cx} 14 L${cx + 6} 20 L${cx} 26 L${cx - 6} 20 Z`} fill={ground} />
      <path d={`M${cx} 17.2 L${cx + 2.8} 20 L${cx} 22.8 L${cx - 2.8} 20 Z`} fill={gold} />
      {/* hooks off each side of the diamond */}
      <path
        d={`M${cx + 5.5} 14.5 L${cx + 8.5} 11.5 H${cx + 11} M${cx - 5.5} 14.5 L${cx - 8.5} 11.5 H${cx - 11} M${cx + 5.5} 25.5 L${cx + 8.5} 28.5 H${cx + 11} M${cx - 5.5} 25.5 L${cx - 8.5} 28.5 H${cx - 11}`}
        fill="none"
        stroke={main}
        strokeWidth={1.3}
      />
      <path d={`M${cx - TILE / 2} 16.5 L${cx - TILE / 2 + 3.5} 20 L${cx - TILE / 2} 23.5 L${cx - TILE / 2 - 3.5} 20 Z`} fill={gold} />
    </g>
  );
}

/** Tiles are laid out symmetrically from the centre, so the band looks balanced at any width. */
export function CarpetBand({ width = "100%", tone = "light", className }: { width?: Size; tone?: OrnamentTone; className?: string }) {
  const c = ornamentColors(tone);
  const tiles = Array.from({ length: 28 }, (_, i) => i - 14);
  return (
    <svg width={width} height={40} className={cn("block overflow-hidden", className)} {...hidden}>
      <g strokeWidth={1}>
        <line x1={0} y1={1.5} x2="100%" y2={1.5} stroke={c.gold} />
        <line x1={0} y1={5} x2="100%" y2={5} stroke={c.ink} opacity={0.6} />
        <line x1={0} y1={35} x2="100%" y2={35} stroke={c.ink} opacity={0.6} />
        <line x1={0} y1={38.5} x2="100%" y2={38.5} stroke={c.gold} />
      </g>
      <At x="50%" y={0}>
        {tiles.map((i) => (
          <CarpetTile key={i} cx={i * TILE + TILE / 2} main={i % 2 === 0 ? c.red : c.ink} gold={c.gold} ground={c.ground} />
        ))}
      </At>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * 7. SectionHeading — Armenian title between gold leaves, translation below
 * ------------------------------------------------------------------------ */

function Leaves({ flip, color }: { flip?: boolean; color: string }) {
  return (
    <svg viewBox="0 0 30 14" width={30} height={14} className="shrink-0" {...hidden}>
      <g transform={flip ? "translate(30 0) scale(-1 1)" : undefined} fill={color}>
        <path d="M1 7 H22" stroke={color} strokeWidth={1} />
        <path d="M22 7 C24.5 3.5, 27.5 3.5, 29 7 C27.5 10.5, 24.5 10.5, 22 7 Z" />
        <path d="M15 7 C15.5 3.5, 18.5 1.5, 21 2 C20.5 5, 18 7, 15 7 Z" />
        <path d="M15 7 C15.5 10.5, 18.5 12.5, 21 12 C20.5 9, 18 7, 15 7 Z" />
        <path d="M8 7 C8.5 4.5, 10.5 3, 13 3.2 C12.5 5.5, 10.5 7, 8 7 Z" />
        <path d="M8 7 C8.5 9.5, 10.5 11, 13 10.8 C12.5 8.5, 10.5 7, 8 7 Z" />
      </g>
    </svg>
  );
}

/**
 * The heading holds both languages, so screen readers announce the whole
 * title; the second-language line carries its own `lang`.
 */
export function SectionHeading({
  id,
  hy,
  translation,
  lang,
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  hy: string;
  translation?: string | null;
  lang?: string | null;
  tone?: OrnamentTone;
  as?: ElementType;
  className?: string;
}) {
  const c = ornamentColors(tone);
  const showTranslation = !!translation && !!lang && translation !== hy;
  return (
    <Tag id={id} className={cn("flex flex-col items-center text-center", className)}>
      <span className="flex items-center justify-center gap-3">
        <Leaves color={c.gold} />
        <span className="her-title">{hy}</span>
        <Leaves flip color={c.gold} />
      </span>
      {showTranslation && (
        <span lang={lang ?? undefined} className="her-tr mt-1 block text-[1.3125rem] leading-snug">
          {translation}
        </span>
      )}
    </Tag>
  );
}
