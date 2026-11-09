import type { CSSProperties, ReactNode } from "react";
import { OLD_MONEY, oldMoneyColors, type OldMoneyTone } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";

/**
 * Old Money ornament kit: flat SVGs in two or three colours, light or dark
 * tone, decorative and hidden from assistive technology. No hooks, so they
 * render in server and client components alike.
 */

type Size = number | string;
const hidden = { "aria-hidden": true, focusable: "false" } as const;
const r2 = (n: number) => Math.round(n * 100) / 100;
const DISPLAY = { fontFamily: "var(--font-om-display), var(--font-display-hy), serif" } as const;
const TEXT = { fontFamily: "var(--font-om-text), var(--font-display-hy), serif" } as const;

/** A lens-shaped leaf pointing along +x from the origin. */
const LEAF = "M0 0 C4 -3.4, 10 -3.7, 15 0 C10 3.7, 4 3.4, 0 0 Z";

function Leaf({ x, y, angle, scale = 1, fill }: { x: number; y: number; angle: number; scale?: number; fill: string }) {
  return <path d={LEAF} fill={fill} transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(angle)}) scale(${scale})`} />;
}

function Lozenge({ x, y, half, fill, stroke, strokeWidth }: { x: number; y: number; half: number; fill: string; stroke?: string; strokeWidth?: number }) {
  return <path d={`M${x} ${y - half} L${x + half} ${y} L${x} ${y + half} L${x - half} ${y} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
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
 * EngravedBorder
 * ------------------------------------------------------------------------ */

/**
 * A rule `inset` px from every edge, `cut` px short of each corner. SVG can't
 * say "100% − 12px", so each line runs to a percentage and a transform pulls
 * it back — the border fits any box without measuring it.
 */
function Rule({ inset: i, cut = 0, stroke, width }: { inset: number; cut?: number; stroke: string; width: number }) {
  const a = i + cut;
  return (
    <g stroke={stroke} strokeWidth={width} fill="none">
      <line x1={a + a} y1={i} x2="100%" y2={i} transform={`translate(${-a} 0)`} />
      <line x1={a + a} y1="100%" x2="100%" y2="100%" transform={`translate(${-a} ${-i})`} />
      <line x1={i} y1={a + a} x2={i} y2="100%" transform={`translate(0 ${-a})`} />
      <line x1="100%" y1={a + a} x2="100%" y2="100%" transform={`translate(${-i} ${-a})`} />
    </g>
  );
}

const OUTER = 12;
const INNER = 18;
const NOTCH = 10;

/**
 * 1.5px gold rule at 12px, 0.6px gold hairline at 18px with 10px concave cut
 * corners, and a small lozenge in each corner. Fills its box; keep ≥ 40px of
 * padding inside so it never sits behind text.
 */
export function EngravedBorder({ tone = "light", className }: { tone?: OldMoneyTone; className?: string }) {
  const c = oldMoneyColors(tone);
  // Drawn for the top-left corner; mirrored into the others.
  const corner = (
    <g>
      <path d={`M${INNER + NOTCH} ${INNER} A${NOTCH} ${NOTCH} 0 0 1 ${INNER} ${INNER + NOTCH}`} fill="none" stroke={c.gold} strokeWidth={0.6} />
      <Lozenge x={21} y={21} half={4.5} fill={c.lozenge} />
    </g>
  );
  return (
    <svg width="100%" height="100%" className={cn("pointer-events-none", className)} {...hidden}>
      <Rule inset={OUTER} stroke={c.gold} width={1.5} />
      <Rule inset={INNER} cut={NOTCH} stroke={c.gold} width={0.6} />
      <At x={0} y={0}>
        {corner}
      </At>
      <At x="100%" y={0}>
        <g transform="scale(-1 1)">{corner}</g>
      </At>
      <At x={0} y="100%">
        <g transform="scale(1 -1)">{corner}</g>
      </At>
      <At x="100%" y="100%">
        <g transform="scale(-1 -1)">{corner}</g>
      </At>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * CrestMonogram
 * ------------------------------------------------------------------------ */

const W_CX = 120;
const W_CY = 110;
const W_R = 90;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** One branch of the wreath, from the bottom (112°) up the left side to the top (258°). */
function WreathBranch({ leaf, berry }: { leaf: string; berry: string }) {
  const from = 112;
  const to = 258;
  const p = (deg: number, r = W_R) => ({ x: W_CX + r * Math.cos(rad(deg)), y: W_CY + r * Math.sin(rad(deg)) });
  const start = p(from);
  const end = p(to);
  const leaves: ReactNode[] = [];
  for (let deg = from + 6, i = 0; deg < to; deg += 12, i++) {
    const at = p(deg);
    // Direction of growth (towards the top), then tilted out and in by 38°.
    const tangent = (Math.atan2(Math.cos(rad(deg)), -Math.sin(rad(deg))) * 180) / Math.PI;
    leaves.push(<Leaf key={`o${i}`} x={at.x} y={at.y} angle={tangent - 38} fill={leaf} />);
    leaves.push(<Leaf key={`i${i}`} x={at.x} y={at.y} angle={tangent + 38} scale={0.92} fill={leaf} />);
  }
  const tipAngle = (Math.atan2(Math.cos(rad(to)), -Math.sin(rad(to))) * 180) / Math.PI;
  return (
    <g>
      <path d={`M${r2(start.x)} ${r2(start.y)} A${W_R} ${W_R} 0 0 1 ${r2(end.x)} ${r2(end.y)}`} fill="none" stroke={leaf} strokeWidth={1.2} />
      {leaves}
      <Leaf x={end.x} y={end.y} angle={tipAngle} fill={leaf} />
      {[146, 196, 236].map((deg) => {
        const b = p(deg, W_R - 9);
        return <circle key={deg} cx={r2(b.x)} cy={r2(b.y)} r={1.9} fill={berry} />;
      })}
    </g>
  );
}

/**
 * Initials in a laurel wreath with the date in Roman numerals on a ribbon.
 * One initial for one-host events. `size` is the width; height is 1.0×.
 * The ribbon date is engraving-sized; the real date is always printed nearby.
 */
export function CrestMonogram({
  initials,
  romanDate,
  size = 240,
  tone = "light",
  className,
  style,
}: {
  initials: string[];
  romanDate: string;
  size?: number;
  tone?: OldMoneyTone;
  className?: string;
  style?: CSSProperties;
}) {
  const c = oldMoneyColors(tone);
  const [one, two] = initials;
  const long = romanDate.length > 21;
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={className} style={style} {...hidden}>
      <WreathBranch leaf={c.gold} berry={c.second} />
      <g transform="translate(240 0) scale(-1 1)">
        <WreathBranch leaf={c.gold} berry={c.second} />
      </g>
      <circle cx={W_CX} cy={W_CY} r={66} fill="none" stroke={c.gold} strokeWidth={1} />
      <circle cx={W_CX} cy={W_CY} r={62} fill="none" stroke={c.gold} strokeWidth={0.5} />

      {two ? (
        <>
          <text x={96} y={134} textAnchor="middle" fontSize={64} fill={c.ink} style={DISPLAY}>
            {one}
          </text>
          <text x={146} y={134} textAnchor="middle" fontSize={64} fontStyle="italic" fill={c.second} style={DISPLAY}>
            {two}
          </text>
        </>
      ) : (
        <text x={W_CX} y={141} textAnchor="middle" fontSize={84} fill={c.ink} style={DISPLAY}>
          {one}
        </text>
      )}

      {/* Ribbon: notched tails behind a gently arched band. */}
      <path d="M58 206 L26 209 L38 217.5 L26 226 L58 228 Z" fill={c.ribbon} />
      <path d="M182 206 L214 209 L202 217.5 L214 226 L182 228 Z" fill={c.ribbon} />
      <path d="M50 203 Q120 190 190 203 L190 225 Q120 212 50 225 Z" fill={c.ribbon} />
      <text
        x={W_CX}
        y={214.5}
        textAnchor="middle"
        fontSize={10.5}
        letterSpacing={0.8}
        fill={c.ribbonText}
        style={TEXT}
        {...(long ? { textLength: 128, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {romanDate}
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * WaxSeal
 * ------------------------------------------------------------------------ */

/** An irregular wax edge: a circle with a few low-frequency wobbles, deterministic. */
function waxEdge(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 72 }, (_, i) => {
    const t = (i / 72) * Math.PI * 2;
    const rr = r + 2.6 * Math.sin(6 * t + 0.4) + 1.8 * Math.sin(11 * t + 1.3) + 1.1 * Math.sin(17 * t + 2.1);
    return `${r2(cx + rr * Math.cos(t))} ${r2(cy + rr * Math.sin(t))}`;
  });
  return `M${points.join(" L")} Z`;
}

const WAX_EDGE = waxEdge(60, 60, 52);

/** Three flat greens, pressed with the monogram. `size` is the diameter. */
export function WaxSeal({ initials, size = 120, className }: { initials: string[]; size?: number; className?: string }) {
  const w = OLD_MONEY.wax;
  const [one, two] = initials;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} {...hidden}>
      <path d={WAX_EDGE} fill={w.base} />
      <circle cx={60} cy={60} r={41} fill={w.shade} />
      <circle cx={60} cy={60} r={36.5} fill={w.base} />
      <circle cx={60} cy={60} r={33} fill="none" stroke={w.light} strokeWidth={0.8} strokeDasharray="2 2.2" />
      {two ? (
        <>
          <text x={48} y={71} textAnchor="middle" fontSize={30} fill={w.light} style={DISPLAY}>
            {one}
          </text>
          <text x={72} y={71} textAnchor="middle" fontSize={30} fontStyle="italic" fill={w.light} style={DISPLAY}>
            {two}
          </text>
        </>
      ) : (
        <text x={60} y={73} textAnchor="middle" fontSize={38} fill={w.light} style={DISPLAY}>
          {one}
        </text>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Divider, LaurelSprig, LabelRule
 * ------------------------------------------------------------------------ */

/** A thick rule over a thin rule each side, two leaves and a centre lozenge. Scales down to its container. */
export function Divider({ width = 290, tone = "light", className }: { width?: number; tone?: OldMoneyTone; className?: string }) {
  const c = oldMoneyColors(tone);
  const mid = width / 2;
  const half = (flip: boolean) => (
    <g transform={flip ? `translate(${width} 0) scale(-1 1)` : undefined}>
      <line x1={0} y1={9} x2={mid - 42} y2={9} stroke={c.gold} strokeWidth={1.5} />
      <line x1={14} y1={13} x2={mid - 44} y2={13} stroke={c.gold} strokeWidth={0.6} />
      <path d={`M${mid - 35} 9 C${mid - 29} 5, ${mid - 19} 5, ${mid - 14} 9 C${mid - 20} 11, ${mid - 29} 11, ${mid - 35} 9 Z`} fill={c.gold} />
      <path d={`M${mid - 33} 13 C${mid - 27} 16.5, ${mid - 19} 15.5, ${mid - 14} 11.5`} fill="none" stroke={c.gold} strokeWidth={0.6} />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${width} 22`} width={width} height={22} className={cn("h-auto max-w-full", className)} {...hidden}>
      {half(false)}
      {half(true)}
      <Lozenge x={mid} y={9} half={7} fill={c.gold} />
      <Lozenge x={mid} y={9} half={2.8} fill={tone === "dark" ? c.ground : c.ink} />
    </svg>
  );
}

/** A curved stem rising to the right with leaf pairs and two berries; `flip` mirrors it. */
export function LaurelSprig({ width = 132, tone = "light", flip = false, className }: { width?: number; tone?: OldMoneyTone; flip?: boolean; className?: string }) {
  const c = oldMoneyColors(tone);
  // Quadratic stem from (4,30) through control (60,24) to (128,8).
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * 4 + 2 * u * t * 60 + t * t * 128,
      y: u * u * 30 + 2 * u * t * 24 + t * t * 8,
      angle: (Math.atan2(2 * u * (24 - 30) + 2 * t * (8 - 24), 2 * u * (60 - 4) + 2 * t * (128 - 60)) * 180) / Math.PI,
    };
  };
  const pairs = [0.2, 0.34, 0.48, 0.62, 0.76, 0.88].map((t, i) => {
    const p = at(t);
    const scale = 1 - i * 0.05;
    return (
      <g key={t}>
        <Leaf x={p.x} y={p.y} angle={p.angle - 42} scale={scale} fill={c.gold} />
        <Leaf x={p.x} y={p.y} angle={p.angle + 42} scale={scale} fill={c.gold} />
      </g>
    );
  });
  const tip = at(1);
  const berries = [0.27, 0.55].map((t) => {
    const p = at(t);
    return <circle key={t} cx={r2(p.x + 1)} cy={r2(p.y + 4.5)} r={1.8} fill={c.second} />;
  });
  return (
    <svg viewBox="0 0 132 38" width={width} height={(width * 38) / 132} className={className} {...hidden}>
      <g transform={flip ? "translate(132 0) scale(-1 1)" : undefined}>
        <path d="M4 30 Q60 24 128 8" fill="none" stroke={c.gold} strokeWidth={1.3} />
        {pairs}
        <Leaf x={tip.x - 2} y={tip.y + 0.5} angle={tip.angle} fill={c.gold} />
        {berries}
      </g>
    </svg>
  );
}

/** Two hairlines and a small open diamond, under section titles. */
export function LabelRule({ tone = "light", className }: { tone?: OldMoneyTone; className?: string }) {
  const c = oldMoneyColors(tone);
  return (
    <svg viewBox="0 0 92 12" width={92} height={12} className={className} {...hidden}>
      <line x1={0} y1={6} x2={37} y2={6} stroke={c.gold} strokeWidth={1} />
      <line x1={55} y1={6} x2={92} y2={6} stroke={c.gold} strokeWidth={1} />
      <Lozenge x={46} y={6} half={5} fill="none" stroke={c.gold} strokeWidth={1} />
      <circle cx={46} cy={6} r={1.3} fill={tone === "dark" ? c.accent : c.ink} />
    </svg>
  );
}
