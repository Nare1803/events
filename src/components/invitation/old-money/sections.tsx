import Image from "next/image";
import type { CSSProperties } from "react";
import { brand } from "@/config/brand";
import { interpolate } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { oldMoneyStyle } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import type { InvitationView, OldMoneyView } from "@/types/invitation";
import { Reveal } from "../reveal";
import { Multiline } from "../section";
import { CrestMonogram, Divider, EngravedBorder, LabelRule, LaurelSprig } from "./ornaments";
import { enter, FramedPhoto, Names, Screen, SectionHeader } from "./primitives";

type Props = { view: InvitationView & { oldMoney: OldMoneyView } };

/* 2. Hero ----------------------------------------------------------------- */

export function OldMoneyHero({ view }: Props) {
  const { event, oldMoney: om } = view;
  const photo = !!event.heroImage;
  return (
    <Screen as="header" wide className="flex min-h-svh flex-col justify-center">
      {/* Phone: crest, photo, text. Desktop: photo left, crest and text right. */}
      <div
        className={cn(
          "grid w-full justify-items-center gap-y-9 text-center [grid-template-areas:'crest'_'photo'_'text']",
          photo && "lg:grid-cols-2 lg:items-center lg:gap-x-16 lg:gap-y-7 lg:[grid-template-areas:'photo_crest'_'photo_text']",
        )}
      >
        <div {...enter(100, "[grid-area:crest] lg:self-end")}>
          <CrestMonogram initials={om.initials} romanDate={om.romanDate} size={128} />
        </div>
        {event.heroImage && (
          <div {...enter(250, "[grid-area:photo] w-full max-w-[16rem] lg:max-w-[28rem]")}>
            <FramedPhoto
              src={event.heroImage}
              alt={displayNames(event.partnerOne, event.partnerTwo)}
              aspect="6 / 7"
              hero
              preload
              sizes="(min-width: 1024px) 448px, 256px"
            />
          </div>
        )}
        <div className="flex flex-col items-center [grid-area:text] lg:self-start">
          <h1 {...enter(450, "om-names om-names-hero")}>
            <Names one={event.partnerOne} two={event.partnerTwo} />
          </h1>
          <p {...enter(650, "om-date mt-3")}>
            <time dateTime={event.dateISO}>{om.fullDate}</time>
          </p>
          {event.heroSubtitle && <p {...enter(800, "om-subtitle mt-3")}>{event.heroSubtitle}</p>}
          <div {...enter(950, "mt-8 hidden w-full justify-center lg:flex")}>
            <Divider />
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* 3. Welcome — the engraved card ------------------------------------------ */

export function OldMoneyWelcome({ view }: Props) {
  const { event, guest, t } = view;
  const oneHost = !event.partnerTwo.trim();
  return (
    <section id="welcome" aria-labelledby="welcome-names" className="bg-om-linen px-8 py-24 lg:py-28">
      <Reveal className="relative isolate mx-auto w-full max-w-[22.5rem] bg-om-cotton px-9 pb-14 pt-14 text-center lg:max-w-[36rem] lg:px-16 lg:py-20">
        <EngravedBorder className="absolute inset-0 -z-10" />
        <LaurelSprig width={104} className="mx-auto" />
        {!oneHost && <p className="om-label mt-6 text-inv-text">{t.oldMoney.togetherWithFamilies}</p>}
        <h2 id="welcome-names" className={cn("om-display mt-3 text-balance", oneHost ? "text-[2.75rem] leading-[1.12]" : "text-[2.25rem] leading-[1.15]")}>
          <Names one={event.partnerOne} two={event.partnerTwo} />
        </h2>
        <p className="om-request mt-3">{oneHost ? t.oldMoney.requestPleasureOne : t.oldMoney.requestPleasure}</p>
        <LabelRule className="mx-auto mt-6" />
        {event.welcomeText && (
          <p className="om-body mt-6 text-inv-muted">
            <Multiline text={event.welcomeText} />
          </p>
        )}
        {guest && <p className="om-personal mt-6">{interpolate(t.welcome.personal, { name: guest.name })}</p>}
      </Reveal>
    </section>
  );
}

/* 5. Order of the day ----------------------------------------------------- */

export function OldMoneySchedule({ view }: Props) {
  const { schedule, t } = view;
  if (schedule.length === 0) return null;
  return (
    // Desktop: a linen band with the items as one row of up to four columns.
    <Screen id="schedule" labelledBy="schedule-heading" wide band="bg-inv-bg lg:bg-om-linen">
      <SectionHeader id="schedule-heading" label={t.schedule.eyebrow} title={t.schedule.title} />
      <ol
        className="mt-8 border-y border-om-gold text-left lg:mt-12 lg:grid lg:[grid-template-columns:repeat(var(--om-cols),minmax(0,1fr))]"
        style={{ "--om-cols": Math.min(4, schedule.length) } as CSSProperties}
      >
        {schedule.map((item, index) => (
          <Reveal
            key={item.id}
            as="li"
            delay={index * 80}
            className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 border-om-gold/70 py-6 [&:not(:first-child)]:border-t-[0.5px] lg:grid-cols-1 lg:gap-y-3 lg:px-8 lg:py-8 lg:[&:not(:first-child)]:border-t-0 lg:[&:not(:nth-child(4n+1))]:border-l-[0.5px]"
          >
            <p className="om-time">
              <time>{item.time}</time>
            </p>
            <div className="min-w-0">
              <h3 className="om-item-title">{item.title}</h3>
              {item.description && <p className="om-desc mt-1">{item.description}</p>}
              {item.locationName && <p className="om-label om-label-sm mt-2">{item.locationName}</p>}
            </div>
          </Reveal>
        ))}
      </ol>
    </Screen>
  );
}

/* 6. Venues --------------------------------------------------------------- */

export function OldMoneyVenues({ view }: Props) {
  const { locations, t } = view;
  if (locations.length === 0) return null;
  return (
    <Screen id="venues" labelledBy="venues-heading" cards>
      <SectionHeader id="venues-heading" label={t.locations.eyebrow} title={t.heritage.venues} />
      <div className="mt-8 flex flex-col gap-6">
        {locations.map((location) => (
          <Reveal key={location.id} as="article" className="border border-om-gold bg-om-cotton p-5 text-left">
            <div className="flex gap-5">
              {location.image && (
                <FramedPhoto src={location.image} alt={location.name} aspect="4 / 5" gap={4} sizes="96px" className="w-24 shrink-0 self-start" />
              )}
              <div className="min-w-0">
                <p className="om-label om-label-sm">{t.locations.kinds[location.kind]}</p>
                <h3 className="om-display mt-1 text-[1.5rem] leading-[1.2] text-balance">{location.name}</h3>
                <p className="om-desc mt-1">{location.address}</p>
              </div>
            </div>
            {location.description && <p className="om-text mt-5 text-[1.0625rem] leading-[1.6]">{location.description}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className="om-button om-button-outline om-button-card">
                {t.locations.openInMaps}
                <span className="sr-only">: {location.name}</span>
              </a>
              <a href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="om-button om-button-card">
                {t.locations.directions}
                <span className="sr-only">: {location.name}</span>
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </Screen>
  );
}

/* 7. Dress code ----------------------------------------------------------- */

export function OldMoneyDressCode({ view }: Props) {
  const { dressCode, t } = view;
  if (!dressCode) return null;
  return (
    <Screen id="dress-code" labelledBy="dress-code-heading">
      <SectionHeader id="dress-code-heading" label={t.dressCode.eyebrow} title={dressCode.title} />
      {dressCode.image && (
        <Reveal className="mx-auto mt-10 w-[12.75rem]">
          <FramedPhoto src={dressCode.image} alt={dressCode.title} aspect="4 / 5" sizes="204px" />
        </Reveal>
      )}
      {dressCode.description && (
        <Reveal delay={100}>
          <p className="om-body mx-auto mt-10 max-w-[30rem] text-center">{dressCode.description}</p>
        </Reveal>
      )}
      {dressCode.swatches.length > 0 && (
        <Reveal delay={160}>
          <ul aria-label={t.dressCode.palette} className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-6">
            {dressCode.swatches.map((swatch, index) => (
              <li key={`${swatch.hex}-${index}`} className="flex w-[4.75rem] flex-col items-center">
                <span className="block h-11 w-11 rounded-full border border-om-rule" style={{ backgroundColor: swatch.hex }} aria-hidden="true" />
                <span className="om-text mt-2 text-center text-[1.0625rem] leading-tight">{swatch.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </Screen>
  );
}

/* 8. Gallery -------------------------------------------------------------- */

type Layout = { cols: 2 | 3; row: number; spans: [number, number][] };

/**
 * Span patterns per photo count. Each fills its grid exactly (column × row
 * spans add up to whole rows), so no cell is ever left empty.
 */
const GALLERY: Record<number, Layout> = {
  1: { cols: 2, row: 124, spans: [[2, 3]] },
  2: { cols: 2, row: 124, spans: [[2, 2], [2, 2]] },
  3: { cols: 2, row: 124, spans: [[2, 2], [1, 2], [1, 2]] },
  4: { cols: 2, row: 124, spans: [[2, 2], [1, 2], [1, 1], [1, 1]] },
  5: { cols: 3, row: 92, spans: [[2, 2], [1, 2], [1, 1], [1, 1], [1, 1]] },
  6: { cols: 3, row: 92, spans: [[2, 2], [1, 2], [1, 1], [2, 1], [2, 1], [1, 1]] },
  7: { cols: 3, row: 92, spans: [[2, 2], [1, 2], [1, 1], [2, 1], [1, 2], [2, 1], [2, 1]] },
  8: { cols: 3, row: 92, spans: [[2, 2], [1, 2], [1, 1], [2, 1], [1, 2], [2, 1], [1, 1], [1, 1]] },
};

export function OldMoneyGallery({ view }: Props) {
  const images = view.gallery.slice(0, 8);
  if (images.length === 0) return null;
  const layout = GALLERY[images.length];
  return (
    <Screen id="story" labelledBy="story-heading">
      <SectionHeader id="story-heading" label={view.t.oldMoney.gallery} title={view.t.gallery.eyebrow} />
      <div
        className="mt-8 grid grid-flow-row-dense gap-2 [grid-auto-rows:var(--om-row)] [grid-template-columns:repeat(var(--om-gcols),minmax(0,1fr))] lg:mt-12 lg:[grid-auto-rows:var(--om-row-lg)]"
        style={{ "--om-gcols": layout.cols, "--om-row": `${layout.row}px`, "--om-row-lg": `${Math.round(layout.row * 2.05)}px` } as CSSProperties}
      >
        {images.map((image, index) => {
          const [col, row] = layout.spans[index];
          return (
            <Reveal key={image.id} variant="image" delay={(index % 3) * 100} className="relative overflow-hidden bg-om-linen" style={{ gridColumn: `span ${col}`, gridRow: `span ${row}` }}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={col === layout.cols ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 420px, 66vw"}
                quality={80}
                className="object-cover"
                placeholder={image.placeholder ? "blur" : "empty"}
                blurDataURL={image.placeholder ?? undefined}
              />
            </Reveal>
          );
        })}
      </div>
    </Screen>
  );
}

/* 10. Closing ------------------------------------------------------------- */

export function OldMoneyClosing({ view }: Props) {
  const { event, oldMoney: om, t } = view;
  return (
    <Screen as="footer" tone="dark" band="bg-inv-bg text-inv-text" style={oldMoneyStyle("dark")} className="text-center">
      <Reveal className="flex justify-center">
        <CrestMonogram tone="dark" initials={om.initials} romanDate={om.romanDate} size={150} />
      </Reveal>
      {event.closingText && (
        <Reveal delay={100}>
          <p className="om-closing mt-8">
            <Multiline text={event.closingText} />
          </p>
        </Reveal>
      )}
      <Reveal delay={160} className="mt-8 flex justify-center">
        <Divider tone="dark" width={250} />
      </Reveal>
      <Reveal delay={220} className="mt-8">
        <p className="om-display text-[2.25rem] leading-[1.15] text-om-label text-balance">
          <Names one={event.partnerOne} two={event.partnerTwo} />
        </p>
        <p className="om-date mt-2 text-inv-muted">
          <time dateTime={event.dateISO}>{om.fullDate}</time>
        </p>
      </Reveal>
      <p className="om-label om-label-sm mt-16 text-inv-muted">{interpolate(t.final.madeWith, { brand: brand.name })}</p>
    </Screen>
  );
}
