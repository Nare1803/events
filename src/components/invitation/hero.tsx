import Image from "next/image";
import type { InvitationView } from "@/types/invitation";
import { Sprig } from "./botanical";

type HeroProps = { view: InvitationView };

/**
 * Entrance animations are gated on the shell's `data-opened` attribute, so the
 * hero comes alive exactly when the intro lifts — not while it is still covered.
 */
const enter = (delay: number, className = "") => ({
  className: `opacity-0 group-data-[opened=true]/inv:animate-rise ${className}`,
  style: { animationDelay: `${delay}ms` },
});

const NAME_SIZES = {
  xl: "text-[clamp(3.75rem,17vw,10rem)]",
  lg: "text-[clamp(3.25rem,13vw,7.5rem)]",
  md: "text-[clamp(2.75rem,11vw,4.75rem)]",
};

function Names({ view, size }: HeroProps & { size: keyof typeof NAME_SIZES }) {
  const { partnerOne, partnerTwo } = view.event;
  const text = NAME_SIZES[size];
  return (
    <h1 className={`inv-display ${text} leading-[0.9]`}>
      <span {...enter(250, "block")}>{partnerOne}</span>
      {partnerTwo && (
        <>
          <span {...enter(450, "my-1 block font-serif text-[0.5em] italic")}>&amp;</span>
          <span {...enter(650, "block")}>{partnerTwo}</span>
        </>
      )}
    </h1>
  );
}

function ScrollCue({ label }: { label: string }) {
  return (
    <div {...enter(1400, "flex flex-col items-center gap-3")} aria-hidden="true">
      <span className="inv-eyebrow text-[0.625rem] opacity-70">{label}</span>
      <span className="block h-10 w-px animate-drift bg-current" />
    </div>
  );
}

export function Hero({ view }: HeroProps) {
  if (view.theme.hero === "framed") return <FramedHero view={view} />;
  if (view.theme.hero === "botanical") return <BotanicalHero view={view} />;
  return <FullBleedHero view={view} />;
}

function FullBleedHero({ view }: HeroProps) {
  const { event, theme, t } = view;
  return (
    <header className="relative isolate flex min-h-[560px] h-svh flex-col items-center justify-between overflow-hidden bg-inv-inverse-bg px-6 pb-10 pt-12 text-center text-inv-inverse-text sm:pb-14 sm:pt-16">
      {event.heroImage && (
        <div className="absolute inset-0 -z-20 group-data-[opened=true]/inv:animate-settle">
          <Image src={event.heroImage} alt="" fill preload sizes="100vw" quality={80} className="object-cover" />
        </div>
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(180deg, rgba(20,17,15,${theme.heroOverlay / 100 + 0.1}) 0%, rgba(20,17,15,${theme.heroOverlay / 200}) 40%, rgba(20,17,15,${theme.heroOverlay / 100 + 0.25}) 100%)`,
        }}
        aria-hidden="true"
      />

      <p {...enter(100, "inv-eyebrow")}>
        {theme.showMonogram ? event.monogram : event.label}
      </p>

      <div className="flex flex-col items-center">
        <Names view={view} size="xl" />
        <p {...enter(900, "inv-eyebrow mt-10 text-[0.75rem] tracking-[0.42em]")}>
          <time dateTime={event.dateISO}>{event.dotDate}</time>
        </p>
        {event.heroSubtitle && (
          <p {...enter(1100, "mt-6 font-serif text-xl italic sm:text-2xl")}>
            {event.heroSubtitle}
          </p>
        )}
      </div>

      <ScrollCue label={t.hero.scroll} />
    </header>
  );
}

function FramedHero({ view }: HeroProps) {
  const { event, theme, t } = view;
  return (
    <header className="flex min-h-svh flex-col items-center justify-center gap-10 bg-inv-bg px-6 py-16 text-center text-inv-text">
      {theme.showMonogram && (
        <p {...enter(100, "inv-eyebrow text-inv-accent")}>
          {event.monogram}
        </p>
      )}
      {event.heroImage && (
        <div {...enter(200, "relative aspect-[3/4] w-[min(72vw,360px)] overflow-hidden rounded-t-full")}>
          <Image src={event.heroImage} alt="" fill preload sizes="(min-width: 640px) 360px, 72vw" quality={80} className="object-cover" />
        </div>
      )}
      <Names view={view} size="lg" />
      <div className="flex flex-col items-center gap-5">
        <p {...enter(900, "inv-eyebrow tracking-[0.42em]")}>
          <time dateTime={event.dateISO}>{event.dotDate}</time>
        </p>
        {event.heroSubtitle && (
          <p {...enter(1100, "font-serif text-xl italic text-inv-muted")}>{event.heroSubtitle}</p>
        )}
      </div>
      <ScrollCue label={t.hero.scroll} />
    </header>
  );
}

function BotanicalHero({ view }: HeroProps) {
  const { event, theme, t } = view;
  return (
    <header className="flex min-h-svh flex-col items-center justify-center gap-8 bg-inv-bg px-5 py-14 text-center text-inv-text">
      <div {...enter(100, "flex flex-col items-center gap-4 text-inv-accent")}>
        <Sprig />
        <p className="inv-eyebrow">{theme.showMonogram ? event.monogram : event.label}</p>
      </div>

      <div className="relative w-full max-w-md">
        {event.heroImage && (
          <div {...enter(200, "relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem]")}>
            <Image src={event.heroImage} alt="" fill preload sizes="(min-width: 480px) 448px, 100vw" quality={80} className="object-cover" />
          </div>
        )}
        <div {...enter(300, `relative mx-5 rounded-[2rem] bg-inv-surface px-6 py-9 ${event.heroImage ? "-mt-20" : ""}`)}>
          <Names view={view} size="md" />
          <p {...enter(900, "inv-eyebrow mt-7 tracking-[0.42em] text-inv-accent")}>
            <time dateTime={event.dateISO}>{event.dotDate}</time>
          </p>
          {event.heroSubtitle && (
            <p {...enter(1100, "mt-4 font-serif text-lg italic text-inv-muted")}>{event.heroSubtitle}</p>
          )}
        </div>
      </div>

      <ScrollCue label={t.hero.scroll} />
    </header>
  );
}
