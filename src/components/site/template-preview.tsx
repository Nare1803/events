import { FILM, HERITAGE, OLD_MONEY, type ThemeTokens } from "@/lib/themes";
import { Sprig } from "@/components/invitation/botanical";
import { Divider, Rosette } from "@/components/invitation/heritage/ornaments";
import { oldMoneyFontVars } from "@/components/invitation/old-money/fonts";
import { CrestMonogram, EngravedBorder } from "@/components/invitation/old-money/ornaments";
import { filmFontVars } from "@/components/invitation/romantic-film/fonts";
import { cn } from "@/lib/utils/cn";

type TemplatePreviewProps = {
  tokens: ThemeTokens;
  heroVariant: string;
  name?: string;
  className?: string;
  muted?: boolean;
};

/**
 * A miniature phone-screen rendering of a template, drawn from its design
 * tokens — so previews always match the real template. Works in server and
 * client components (no hooks, plain <img> for the tiny hero).
 */
export function TemplatePreview({ tokens, heroVariant, name = "Anna & David", className, muted }: TemplatePreviewProps) {
  const c = tokens.colors;
  const [one, two] = name.split(" & ");
  const light = heroVariant === "framed" || heroVariant === "botanical" || heroVariant === "heritage" || heroVariant === "crest";
  return (
    <div
      className={cn("relative aspect-[9/16] w-full overflow-hidden", muted && "grayscale-[60%] opacity-70", className)}
      style={{ background: light ? c.background : c.inverseBackground, color: light ? c.text : c.inverseText }}
      aria-hidden="true"
    >
      {heroVariant === "heritage" ? (
        <HeritageMiniature latinNames={name} />
      ) : heroVariant === "crest" ? (
        <OldMoneyMiniature one={one} two={two} />
      ) : heroVariant === "title-card" ? (
        <FilmMiniature one={one} two={two} />
      ) : heroVariant === "botanical" ? (
        <div className="flex h-full flex-col items-center justify-center gap-[5%] px-[9%] text-center">
          <Sprig className="h-auto w-[45%]" style={{ color: c.accent }} />
          <div className="w-full">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[1.25em]">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
              <img src="/demo/hero.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="relative mx-[9%] -mt-[22%] flex flex-col items-center gap-[0.5em] rounded-[1em] px-[6%] py-[9%]" style={{ background: c.surface }}>
              <Names one={one} two={two} scale={0.75} />
              <span className="text-[0.5em] tracking-[0.35em]" style={{ color: c.accent }}>18 · 07 · 2027</span>
            </div>
          </div>
        </div>
      ) : heroVariant === "framed" ? (
        <div className="flex h-full flex-col items-center justify-center gap-[6%] px-[12%] text-center">
          <div className="aspect-[3/4] w-[62%] overflow-hidden rounded-t-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
            <img src="/demo/hero.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <Names one={one} two={two} />
          <span className="text-[0.55em] tracking-[0.35em]">18 · 07 · 2027</span>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
          <img src="/demo/hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
          <div className="relative flex h-full flex-col items-center justify-center gap-[5%] px-[10%] text-center">
            <Names one={one} two={two} />
            <span className="text-[0.55em] tracking-[0.35em]">18 · 07 · 2027</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Armenian Heritage hero in miniature: the triple manuscript rule, letter-numeral
 * date, arch photo in its gold/red double outline, Armenian names over the
 * second-language line, and the star divider.
 */
function HeritageMiniature({ latinNames }: { latinNames: string }) {
  const H = HERITAGE;
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-[3.2%] px-[15%] text-center">
      <span className="absolute inset-[2.6%] border" style={{ borderColor: H.ink, opacity: 0.7 }} />
      <span className="absolute inset-[4.4%] border-[1.5px]" style={{ borderColor: H.gold }} />
      <span className="absolute inset-[6%] border" style={{ borderColor: H.pomegranate }} />
      <Rosette size={10} color={H.pomegranate} className="absolute left-[4.4%] top-[4.4%] -translate-x-1/2 -translate-y-1/2" />
      <Rosette size={10} color={H.pomegranate} className="absolute right-[4.4%] top-[4.4%] -translate-y-1/2 translate-x-1/2" />
      <Rosette size={10} color={H.pomegranate} className="absolute bottom-[4.4%] left-[4.4%] -translate-x-1/2 translate-y-1/2" />
      <Rosette size={10} color={H.pomegranate} className="absolute bottom-[4.4%] right-[4.4%] translate-x-1/2 translate-y-1/2" />

      <span className="font-serif text-[0.5em] tracking-[0.3em]" style={{ color: H.goldText }}>
        ԺԸ · Է · ՍԻԷ
      </span>
      <div className="w-[58%] rounded-t-full border p-[3%]" style={{ borderColor: H.gold }}>
        <div className="rounded-t-full border p-[3%]" style={{ borderColor: H.pomegranate }}>
          <div className="aspect-[3/4] overflow-hidden rounded-t-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
            <img src="/demo/hero.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </div>
      <span className="font-serif text-[1.3em] font-light leading-none" style={{ color: H.pomegranate }}>
        Աննա և Դավիթ
      </span>
      <span className="font-serif text-[0.85em] italic leading-none" style={{ color: H.muted }}>
        {latinNames}
      </span>
      <Divider width={120} className="w-[48%]" />
    </div>
  );
}

/**
 * Old Money hero in miniature (the approved 9:16 thumbnail): engraved border,
 * crest, framed photo, names with the green italic ampersand, date, subtitle.
 */
function OldMoneyMiniature({ one, two }: { one: string; two?: string }) {
  const C = OLD_MONEY;
  const display = { fontFamily: "var(--font-om-display), serif" };
  const text = { fontFamily: "var(--font-om-text), serif" };
  return (
    <div className={cn(oldMoneyFontVars, "relative flex h-full flex-col items-center justify-center gap-[3.5%] px-[14%] text-center")} style={{ color: C.navy }}>
      <EngravedBorder className="absolute inset-0" />
      <CrestMonogram initials={[one.charAt(0), (two ?? "").charAt(0)].filter(Boolean)} romanDate="XVIII · VII · MMXXVII" size={64} className="h-auto w-[30%]" />
      <div className="w-[60%] border p-[3%]" style={{ borderColor: C.gold }}>
        <div className="aspect-[6/7] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
          <img src="/demo/hero.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
      <span className="text-[1.55em] leading-none" style={display}>
        {one}
        {two && (
          <>
            {" "}
            <span className="italic" style={{ color: C.green }}>
              &amp;
            </span>{" "}
            {two}
          </>
        )}
      </span>
      <span className="text-[0.62em] leading-none" style={text}>
        Sunday, 18 July 2027
      </span>
      <span className="text-[0.62em] italic leading-none" style={{ ...display, color: C.muted }}>
        We found forever.
      </span>
    </div>
  );
}

/**
 * Romantic Film title card in miniature (the approved 9:16 thumbnail at
 * 360 × 640, scaled with the card): 40px letterbox bars, the cover photo
 * behind a scrim that reaches 0.86 before the text, names in Forum 46 with the
 * rose italic ampersand, the amber date, the subtitle, frame box and timecode.
 * Static grain is left out at this size; a light leak at the top left only.
 * Sizes are in cqw, so 1cqw = 3.6px on the 360px export.
 */
function FilmMiniature({ one, two }: { one: string; two?: string }) {
  const C = FILM;
  const display = { fontFamily: "var(--font-rf-display), serif" };
  const text = { fontFamily: "var(--font-rf-text), serif" };
  const code = { ...text, fontSize: "3cqw", fontWeight: 600, letterSpacing: "0.12em" };
  const bar = { height: "11.1cqw", background: C.night };
  return (
    <div className={cn(filmFontVars, "relative flex h-full flex-col [container-type:inline-size]")} style={{ background: C.night, color: C.cream }}>
      <div className="shrink-0" style={bar} />
      <div className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
        <img src="/demo/hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <span
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgb(23 18 15 / 0) 22%, rgb(23 18 15 / 0.86) 58%, rgb(23 18 15 / 0.92) 100%)" }}
        />
        <span
          className="absolute -left-[50cqw] -top-[50cqw] h-[100cqw] w-[100cqw]"
          style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${C.amber} 20%, transparent), transparent)` }}
        />
        <div className="absolute inset-x-0 bottom-[5cqw] flex flex-col items-center text-center">
          <span className="uppercase leading-none" style={{ ...display, fontSize: "12.8cqw", letterSpacing: "0.12em", paddingInlineStart: "0.12em" }}>
            {one}
            {two && (
              <>
                <span className="block normal-case italic leading-[1.15]" style={{ ...text, fontSize: "8.33cqw", fontWeight: 500, letterSpacing: 0, color: C.rose }}>
                  &amp;
                </span>
                {two}
              </>
            )}
          </span>
          <span className="mt-[4cqw] uppercase" style={{ ...display, fontSize: "3.33cqw", letterSpacing: "0.24em", paddingInlineStart: "0.24em", color: C.amber }}>
            Sunday, 18 July 2027
          </span>
          <span className="mt-[1.5cqw] italic" style={{ ...text, fontSize: "4.44cqw" }}>
            We found forever.
          </span>
        </div>
      </div>
      <div
        className="flex shrink-0 items-center justify-between px-[4cqw]"
        style={{ ...bar, borderTop: `1px solid color-mix(in srgb, ${C.amber} 28%, transparent)` }}
      >
        <span className="border px-[1.2cqw] leading-[1.35]" style={{ ...code, color: C.amber, borderColor: C.amber }}>
          02
        </span>
        <span style={{ ...code, color: C.dusk }}>00:02:00:00</span>
      </div>
    </div>
  );
}

function Names({ one, two, scale = 1 }: { one: string; two?: string; scale?: number }) {
  return (
    <span className="font-serif font-light leading-[0.95]" style={{ fontSize: `${2.6 * scale}em` }}>
      {one}
      {two && (
        <>
          <span className="block text-[0.5em] italic">&amp;</span>
          {two}
        </>
      )}
    </span>
  );
}
