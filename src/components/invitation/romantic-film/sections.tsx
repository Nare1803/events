import Image from "next/image";
import type { CSSProperties } from "react";
import { brand } from "@/config/brand";
import { interpolate } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { cn } from "@/lib/utils/cn";
import type { FilmView, GalleryImageView, InvitationView } from "@/types/invitation";
import { Reveal } from "../reveal";
import { Multiline } from "../section";
import { ChevronIcon, Divider, FilmStrip, FrameCorners, frameNo, LabelRule, PinIcon, timecode } from "./ornaments";
import { Atmosphere, enter, Screen, Still, TitleNames } from "./primitives";

type View = InvitationView & { film: FilmView };
type Props = { view: View; n: number; seam?: boolean };

/* 02 · Hero — the title card ---------------------------------------------- */

/**
 * The cover photo between two letterbox bars (64px, 72px on desktop) that
 * close in once the leader is tapped; names, date and subtitle sit on a scrim
 * that reaches 0.86 before the first letter.
 */
export function FilmHero({ view, n }: { view: View; n: number }) {
  const { event, film, t } = view;
  return (
    <header data-rf-dark="" className="rf-dark rf-hero relative isolate h-svh min-h-[36rem] overflow-clip bg-rf-night lg:h-[49rem] lg:min-h-0">
      {event.heroImage && (
        <Image
          src={event.heroImage}
          alt={displayNames(event.partnerOne, event.partnerTwo)}
          fill
          preload
          sizes="100vw"
          quality={80}
          className="object-cover"
        />
      )}
      <span className="rf-hero-scrim absolute inset-0" aria-hidden="true" />
      <Atmosphere leaks={event.heroImage ? [] : ["tl-amber", "br-rose"]} />

      {/* Letterbox bars. The music button and the language pill float inside the top one. */}
      <span className="rf-bar-top absolute inset-x-0 top-0 z-[1] h-16 bg-rf-night lg:h-[4.5rem]" aria-hidden="true" />
      <div className="rf-bar-bottom absolute inset-x-0 bottom-0 z-[1] h-16 border-t border-[color-mix(in_srgb,var(--rf-amber)_28%,transparent)] bg-rf-night lg:h-[4.5rem]">
        <div className="mx-auto grid h-full max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center px-4 lg:px-6">
          <span {...enter(600, "rf-frame-box justify-self-start")} aria-hidden="true">
            {frameNo(n)}
          </span>
          <a href="#welcome" aria-label={t.hero.scroll} {...enter(700, "flex h-11 w-11 items-center justify-center text-rf-amber")}>
            <ChevronIcon />
          </a>
          <span {...enter(600, "rf-edge-code justify-self-end")} aria-hidden="true">
            {timecode(n)}
          </span>
        </div>
      </div>

      <div className="rf-hero-text absolute inset-x-0 bottom-16 z-[1] px-6 pb-7 text-center lg:bottom-[4.5rem] lg:pb-10">
        <TitleNames as="h1" one={event.partnerOne} two={event.partnerTwo} inlineLg {...enter(300, "rf-names-hero")} />
        <p {...enter(500, "rf-title-date mt-5 text-rf-amber")}>
          <time dateTime={event.dateISO}>{film.fullDate}</time>
        </p>
        {event.heroSubtitle && <p {...enter(700, "rf-subtitle mt-2")}>{event.heroSubtitle}</p>}
      </div>
    </header>
  );
}

/* 03 · Welcome — an intertitle --------------------------------------------- */

export function FilmWelcome({ view, n }: Props) {
  const { event, guest, t } = view;
  return (
    <Screen id="welcome" labelledBy="welcome-heading" tone="dark" n={n} leaks={["tl-amber", "tr-rose"]} fill centerCode>
      <Reveal className="rf-intertitle-frame relative mx-auto flex w-full max-w-[40rem] flex-1 flex-col items-center justify-center px-7 py-16 text-center lg:min-h-[34rem] lg:flex-none lg:px-16">
        <FrameCorners arm={22} offset={0} />
        <LabelRule n={n} label={t.film.welcome} as="h2" id="welcome-heading" center />
        {event.welcomeText && (
          <p className="rf-intertitle mt-8 max-w-[26rem]">
            <Multiline text={event.welcomeText} />
          </p>
        )}
        {event.welcomeText && guest && <Divider width={150} className="mt-9" />}
        {guest && <p className="rf-personal mt-9 max-w-[24rem]">{interpolate(t.welcome.personal, { name: guest.name })}</p>}
      </Reveal>
    </Screen>
  );
}

/* 05 · Order of the day — a call sheet ------------------------------------- */

export function FilmSchedule({ view, n, seam }: Props) {
  const { schedule, film, t } = view;
  if (schedule.length === 0) return null;
  return (
    <Screen id="schedule" labelledBy="schedule-heading" tone="light" n={n} leaks={["tr-amber", "br-rose"]} seam={seam}>
      <LabelRule n={n} label={t.film.programme} />
      <Reveal>
        <h2 id="schedule-heading" className="rf-title mt-5">
          {t.schedule.title}
        </h2>
        <p className="rf-small mt-2 text-rf-soft">
          {film.fullDate}
          <span className="hidden lg:inline"> · {film.zone}</span>
        </p>
      </Reveal>

      <Reveal delay={100} className="rf-sheet -mx-2 mt-7 lg:mx-0 lg:mt-12">
        {/* Phone: two columns. */}
        <table className="w-full border-collapse text-left lg:hidden">
          <thead>
            <tr className="bg-rf-night">
              <th scope="col" className="rf-th w-[4.25rem]">
                {t.film.time}
              </th>
              <th scope="col" className="rf-th">
                {t.film.eventVenue}
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, index) => (
              <tr key={item.id} className="border-t border-rf-hairline align-top first:border-t-0">
                <td className="w-[4.25rem] border-r border-rf-hairline px-3 py-4">
                  <span className="rf-edge-code block" aria-hidden="true">
                    {frameNo(index + 1)}
                  </span>
                  <span className="rf-time mt-1 block">
                    <time>{item.time}</time>
                  </span>
                </td>
                <td className="px-3 py-4">
                  <p className="rf-item-title">{item.title}</p>
                  {item.description && <p className="rf-small mt-1 text-rf-soft">{item.description}</p>}
                  {item.locationName && (
                    <p className="rf-venue mt-2">
                      <PinIcon />
                      {item.locationName}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Desktop: the full five-column sheet. */}
        <table className="hidden w-full border-collapse text-left lg:table">
          <thead>
            <tr className="bg-rf-night">
              <th scope="col" className="rf-th w-[5.5rem] pl-5">
                {t.film.number}
              </th>
              <th scope="col" className="rf-th w-[8.5rem]">
                {t.film.time}
              </th>
              <th scope="col" className="rf-th w-[13rem]">
                {t.film.event}
              </th>
              <th scope="col" className="rf-th">
                {t.film.details}
              </th>
              <th scope="col" className="rf-th w-[15rem]">
                {t.film.venue}
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, index) => (
              <tr key={item.id} className="border-t border-rf-hairline align-top first:border-t-0">
                <td className="py-5 pl-5 pr-3">
                  <span className="rf-edge-code">{frameNo(index + 1)}</span>
                </td>
                <td className="px-3 py-4">
                  <span className="rf-time">
                    <time>{item.time}</time>
                  </span>
                </td>
                <td className="px-3 py-5">
                  <p className="rf-item-title">{item.title}</p>
                </td>
                <td className="px-3 py-5">{item.description && <p className="rf-small text-rf-soft">{item.description}</p>}</td>
                <td className="px-3 py-5 pr-5">{item.locationName && <p className="rf-venue">{item.locationName}</p>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </Screen>
  );
}

/* 06 · Venues — letterboxed stills ----------------------------------------- */

const letter = (index: number) => String.fromCharCode(65 + (index % 26));

export function FilmVenues({ view, n, seam }: Props) {
  const { locations, t } = view;
  if (locations.length === 0) return null;
  const cols = Math.min(3, locations.length);
  return (
    <Screen id="venues" labelledBy="venues-heading" tone="light" n={n} leaks={["tr-amber", "br-rose"]} seam={seam}>
      <LabelRule n={n} label={t.heritage.venues} as="h2" id="venues-heading" />
      <div
        className="mt-7 grid gap-8 lg:mt-12 lg:[grid-template-columns:repeat(var(--rf-cols),minmax(0,1fr))]"
        style={{ "--rf-cols": cols, maxWidth: cols < 3 ? `${cols * 23 + (cols - 1) * 2}rem` : undefined } as CSSProperties}
      >
        {locations.map((location, index) => (
          <Reveal key={location.id} as="article" delay={(index % 3) * 80} className="flex flex-col">
            {location.image && (
              <Still
                src={location.image}
                alt={location.name}
                code={`${frameNo(n)}${letter(index)}`}
                imageClassName="aspect-[358/136] lg:aspect-[19/10]"
                sizes="(min-width: 1024px) 368px, 100vw"
                className="-mx-2 lg:mx-0"
              />
            )}
            <p className="rf-eyebrow mt-3.5">{t.locations.kinds[location.kind]}</p>
            <h3 className="rf-card-title mt-1.5">{location.name}</h3>
            {location.description && <p className="rf-small mt-1.5 text-rf-soft">{location.description}</p>}
            {location.address && (
              <p className="rf-xs mt-2.5 flex gap-1.5">
                <PinIcon className="mt-1 text-rf-label" />
                <span>{location.address}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 lg:mt-auto lg:pt-5">
              <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className="rf-button rf-button-ghost rf-button-pair">
                {t.locations.openInMaps}
                <span className="sr-only">: {location.name}</span>
              </a>
              <a href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="rf-button rf-button-pair">
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

/* 07 · Dress code ---------------------------------------------------------- */

export function FilmDressCode({ view, n, seam }: Props) {
  const { dressCode, t } = view;
  if (!dressCode) return null;
  return (
    <Screen id="dress-code" labelledBy="dress-code-heading" tone="light" n={n} leaks={["tr-amber", "br-rose"]} seam={seam}>
      <LabelRule n={n} label={t.dressCode.eyebrow} />
      {/* Phone: title, still, colours. Desktop: text and colours on the left, the still on the right. */}
      <div className="grid [grid-template-areas:'text'_'still'_'colours'] lg:grid-cols-2 lg:gap-x-16 lg:[grid-template-areas:'text_still'_'colours_still']">
        <Reveal className="[grid-area:text]">
          <h2 id="dress-code-heading" className="rf-title mt-5">
            {dressCode.title}
          </h2>
          {dressCode.description && <p className="rf-body mt-3 max-w-[34rem]">{dressCode.description}</p>}
        </Reveal>
        {dressCode.image && (
          <Reveal delay={100} className="mt-6 [grid-area:still] lg:mt-5">
            <Still
              src={dressCode.image}
              alt={dressCode.title}
              code={`${frameNo(n)}A`}
              imageClassName="aspect-[358/220]"
              sizes="(min-width: 1024px) 544px, 100vw"
              corners
              className="-mx-2 lg:mx-0"
            />
          </Reveal>
        )}
        {dressCode.swatches.length > 0 && (
          <Reveal delay={160} className="mt-6 [grid-area:colours] lg:mt-8">
            <p className="rf-field-label" id="dress-code-colours">
              {t.film.colours}
            </p>
            <ul aria-labelledby="dress-code-colours" className="mt-2 grid max-w-[34rem] grid-cols-4 gap-x-2 gap-y-4">
              {dressCode.swatches.map((swatch, index) => (
                <li key={`${swatch.hex}-${index}`} className="flex min-w-0 flex-col items-center">
                  <span className="block h-[3.25rem] w-full rounded-[2px] border border-rf-line" style={{ backgroundColor: swatch.hex }} aria-hidden="true" />
                  <span className="rf-xs mt-2 text-center">{swatch.name}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </Screen>
  );
}

/* 08 · Gallery — a contact sheet ------------------------------------------- */

const units = (image: GalleryImageView) => (image.width > image.height * 1.1 ? 2 : 1);

/**
 * Photos fill strips of film in upload order. A portrait is 1 unit, a
 * landscape 2; strips hold 2 units for 1–4 photos and 4 units for 5–8. A new
 * strip starts when the next photo would overflow — except that a portrait
 * never sits alone: it takes the next photo into its strip, and a lone
 * portrait at the end joins the strip before it. Frames grow by their units,
 * so every strip is full width with no gaps.
 */
export function stripsFor(images: GalleryImageView[]): GalleryImageView[][] {
  const capacity = images.length <= 4 ? 2 : 4;
  const strips: GalleryImageView[][] = [];
  let current: GalleryImageView[] = [];
  let used = 0;
  for (const image of images) {
    const u = units(image);
    const lonePortrait = current.length === 1 && units(current[0]) === 1;
    if (current.length > 0 && used + u > capacity && !lonePortrait) {
      strips.push(current);
      current = [];
      used = 0;
    }
    current.push(image);
    used += u;
  }
  if (current.length > 0) strips.push(current);
  const last = strips[strips.length - 1];
  if (strips.length > 1 && last.length === 1 && units(last[0]) === 1) {
    strips.pop();
    strips[strips.length - 1].push(last[0]);
  }
  return strips;
}

export function FilmGallery({ view, n, seam }: Props) {
  const images = view.gallery.slice(0, 8);
  if (images.length === 0) return null;
  const large = images.length <= 4;
  const capacity = large ? 2 : 4;
  const strips = stripsFor(images);
  // Frame numbers follow upload order (strips keep it).
  const frameOf = new Map(images.map((image, index) => [image.id, index + 1]));
  return (
    <Screen id="gallery" labelledBy="gallery-heading" tone="light" n={n} leaks={["tr-amber", "br-rose"]} seam={seam}>
      <LabelRule n={n} label={view.t.oldMoney.gallery} as="h2" id="gallery-heading" />
      {/* Full-bleed strips; the frames inside keep to the content width. */}
      <div className="mx-[calc(50%-50vw)] mt-7 flex flex-col gap-3 lg:mt-12">
        {strips.map((strip, s) => (
          <Reveal key={strip[0].id} delay={s * 80} className="rf-advance">
            <FilmStrip inner="px-2">
              <div className="mx-auto flex max-w-[78rem] gap-1.5 lg:px-12">
                {strip.map((image) => {
                  const u = units(image);
                  return (
                    <div key={image.id} className="min-w-0" style={{ flex: `${u} 1 0%` }}>
                      <div className={cn("relative overflow-hidden rounded-[2px] bg-rf-night-2", large ? "h-[200px] lg:h-[400px]" : "h-[132px] lg:h-[264px]")}>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes={`(min-width: 1024px) ${Math.round((1152 * u) / capacity)}px, ${Math.round((100 * u) / capacity)}vw`}
                          quality={80}
                          className="object-cover"
                          placeholder={image.placeholder ? "blur" : "empty"}
                          blurDataURL={image.placeholder ?? undefined}
                        />
                      </div>
                      <p className="rf-frame-code mt-1.5" aria-hidden="true">
                        {frameNo(frameOf.get(image.id) ?? 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </FilmStrip>
          </Reveal>
        ))}
      </div>
    </Screen>
  );
}

/* 10 · Closing — end credits ----------------------------------------------- */

export function FilmClosing({ view, n }: Props) {
  const { event, film, t } = view;
  return (
    <Screen as="footer" tone="dark" n={n} leaks={["tl-amber", "br-rose"]} fill edges className="items-center text-center">
      {event.closingImage && (
        <Reveal className="rf-credits w-full max-w-[20rem] lg:max-w-[28rem]">
          <p className="rf-frame-code text-left" aria-hidden="true">
            {frameNo(n)}A
          </p>
          <div className="relative mx-[10px] mt-5">
            <div className="relative aspect-[16/9] overflow-hidden bg-rf-night-2">
              <Image src={event.closingImage} alt="" fill sizes="(min-width: 1024px) 428px, 300px" quality={80} className="object-cover" />
            </div>
            <FrameCorners offset={10} />
          </div>
        </Reveal>
      )}
      <Reveal delay={120} className="rf-credits flex flex-col items-center">
        {event.closingText && (
          <p className="rf-intertitle mt-12 max-w-[22rem]">
            <Multiline text={event.closingText} />
          </p>
        )}
        <Divider width={150} className="mt-8" />
        <TitleNames one={event.partnerOne} two={event.partnerTwo} className="rf-names-closing mt-8" />
        <p className="rf-title-date mt-4 text-rf-amber">
          <time dateTime={event.dateISO}>{film.fullDate}</time>
        </p>
        <p className="rf-eyebrow mt-16 text-rf-soft">{interpolate(t.final.madeWith, { brand: brand.name })}</p>
      </Reveal>
    </Screen>
  );
}
