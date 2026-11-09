import { HERITAGE, OLD_MONEY, type ThemeTokens } from "@/lib/themes";
import { Sprig } from "@/components/invitation/botanical";
import { Divider, Rosette } from "@/components/invitation/heritage/ornaments";
import { oldMoneyFontVars } from "@/components/invitation/old-money/fonts";
import { CrestMonogram, EngravedBorder } from "@/components/invitation/old-money/ornaments";
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
