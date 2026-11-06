import { brand } from "@/config/brand";
import { interpolate } from "@/lib/i18n";
import { HERITAGE, heritageStyle } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import type { HeritageView, InvitationView } from "@/types/invitation";
import { Reveal } from "../reveal";
import { Multiline } from "../section";
import { Corner, Divider, Monogram, Rosette, SectionHeading } from "./ornaments";
import { ArchPhoto, coupleNames, enter, Page, Tr } from "./primitives";

type Props = { view: InvitationView & { heritage: HeritageView } };

/** The couple's names in the second language, only when every name is translated. */
function secondNames(view: Props["view"]): string {
  const s = view.heritage.second;
  if (!s?.partnerOne || (view.event.partnerTwo && !s.partnerTwo)) return "";
  return coupleNames(s.partnerOne, s.partnerTwo, false);
}

/* 2. Hero ----------------------------------------------------------------- */

export function HeritageHero({ view }: Props) {
  const { event, heritage: h } = view;
  const s = h.second;
  const names = coupleNames(event.partnerOne, event.partnerTwo, true);

  return (
    <Page as="header" className="flex min-h-svh flex-col items-center justify-center">
      {/* Decorative restatement of the date; the full date is read below. */}
      <p aria-hidden="true" {...enter(100, "her-numerals")}>
        {h.numeralDate}
      </p>

      {event.heroImage && (
        <div {...enter(250, "mt-8 w-full max-w-[15.5rem]")}>
          <ArchPhoto src={event.heroImage} alt={names} outline="double" preload sizes="248px" />
        </div>
      )}

      <h1 className="mt-9">
        <span {...enter(450, "her-names block")}>
          {event.partnerTwo ? (
            <>
              {event.partnerOne} <span className="text-[0.62em] text-inv-accent">և</span> {event.partnerTwo}
            </>
          ) : (
            event.partnerOne
          )}
        </span>
        <span {...enter(600, "block")}>
          <Tr text={secondNames(view)} primary={names} lang={s?.locale} className="mt-1 text-[1.875rem] leading-tight" />
        </span>
      </h1>

      <div {...enter(750, "mt-7 flex w-full justify-center")}>
        <Divider width={220} />
      </div>

      <p {...enter(900, "mt-6")}>
        <time dateTime={event.dateISO} className="block text-[1.0625rem] leading-7">
          {h.fullDate}
        </time>
        <Tr text={s?.fullDate} lang={s?.locale} className="text-base leading-6" />
      </p>

      {event.heroSubtitle && (
        <p {...enter(1050, "mt-5")}>
          <span className="block text-[0.9375rem] leading-6 text-inv-muted">{event.heroSubtitle}</span>
          <Tr text={s?.heroSubtitle} primary={event.heroSubtitle} lang={s?.locale} className="text-[0.9375rem] leading-6" />
        </p>
      )}
    </Page>
  );
}

/* 3. Welcome -------------------------------------------------------------- */

export function HeritageWelcome({ view }: Props) {
  const { event, guest, t, heritage: h } = view;
  const s = h.second;
  const greeting = guest ? interpolate(t.heritage.dear, { name: guest.name }) : t.heritage.dearGuests;
  const greeting2 = s ? (guest ? interpolate(s.t.heritage.dear, { name: guest.name }) : s.t.heritage.dearGuests) : null;
  const text = event.welcomeText.trim();
  const [initial, ...rest] = Array.from(text);

  return (
    <Page id="welcome" labelledBy="welcome-heading">
      <Reveal>
        <SectionHeading id="welcome-heading" hy={t.welcome.eyebrow} translation={s?.t.welcome.eyebrow} lang={s?.locale} />
      </Reveal>

      <Reveal delay={120} className="mt-10 text-left">
        <p className="text-[1.1875rem] leading-8">{greeting}</p>
        <Tr text={greeting2} lang={s?.locale} className="text-[1.0625rem] leading-7" />

        {text && (
          <div className="mt-5 flow-root">
            <p className="her-body">
              {/* Screen readers get the whole text; the illuminated initial is visual only. */}
              <span className="sr-only">{text}</span>
              <span aria-hidden="true">
                <span className="her-initial">{initial}</span>
                <Multiline text={rest.join("")} />
              </span>
            </p>
            <Tr as="p" text={s?.welcomeText} primary={text} lang={s?.locale} className="her-body-tr mt-4" />
          </div>
        )}

        {event.invitationText && (
          <div className="mt-6">
            <p className="her-body whitespace-pre-line">{event.invitationText}</p>
            <Tr as="p" text={s?.invitationText} primary={event.invitationText} lang={s?.locale} className="her-body-tr mt-3" />
          </div>
        )}
      </Reveal>

      <Reveal delay={200} className="mt-10 flex justify-center">
        <Divider variant="knot" width={200} />
      </Reveal>

      <Reveal delay={260} className="mt-7">
        <p className="text-[1.0625rem] text-inv-muted">{t.heritage.withLove}</p>
        <Tr text={s?.t.heritage.withLove} lang={s?.locale} className="text-base" />
        <p className="her-signature mt-3">{coupleNames(event.partnerOne, event.partnerTwo, true)}</p>
        <Tr text={secondNames(view)} lang={s?.locale} className="mt-0.5 text-[1.375rem]" />
      </Reveal>
    </Page>
  );
}

/* 5. Schedule ------------------------------------------------------------- */

export function HeritageSchedule({ view }: Props) {
  const { schedule, t, heritage: h } = view;
  const s = h.second;
  if (schedule.length === 0) return null;

  return (
    <Page id="schedule" labelledBy="schedule-heading">
      <Reveal>
        <SectionHeading id="schedule-heading" hy={t.heritage.scheduleTitle} translation={s?.t.heritage.scheduleTitle} lang={s?.locale} />
      </Reveal>

      <ol className="relative mx-auto mt-12 max-w-[19rem] text-left">
        {/* Gold timeline */}
        <span className="absolute bottom-2 left-[7px] top-2 w-px bg-her-gold" aria-hidden="true" />
        {schedule.map((item, index) => {
          const tr = s?.schedule[item.id];
          const next = schedule[index + 1];
          // A short "on to …" note wherever the day moves to another venue.
          const moving = !!next?.locationName && !!item.locationId && !!next.locationId && next.locationId !== item.locationId;
          const nextPlace2 = next && s ? s.schedule[next.id]?.locationName : "";
          return (
            <li key={item.id} className="relative pb-10 pl-9 last:pb-0">
              <Rosette size={15} color={HERITAGE.pomegranate} className="absolute left-0 top-[0.45rem]" />
              <Reveal delay={index * 80}>
                <p className="inv-display text-[1.75rem] leading-none text-her-red tabular-nums">
                  <time>{item.time}</time>
                </p>
                <h3 className="mt-2.5 text-[1.1875rem] leading-snug">
                  {item.title}
                  <Tr text={tr?.title} primary={item.title} lang={s?.locale} className="text-[1.0625rem] leading-snug" />
                </h3>
                {item.locationName && (
                  <p className="mt-2 text-[0.9375rem] leading-6 text-inv-muted">
                    {item.locationName}
                    <Tr text={tr?.locationName} primary={item.locationName} lang={s?.locale} className="text-[0.9375rem] leading-6" />
                  </p>
                )}
                {item.description && (
                  <p className="mt-2 text-[0.875rem] leading-6 text-inv-muted">
                    {item.description}
                    <Tr text={tr?.description} primary={item.description} lang={s?.locale} className="text-[0.9375rem] leading-6" />
                  </p>
                )}
              </Reveal>
              {moving && next && (
                <p className="relative mt-6 text-[0.875rem] leading-6 text-inv-accent">
                  <span className="absolute -left-[2.0625rem] top-[0.45rem] block h-2 w-2 rotate-45 border border-her-gold bg-inv-bg" aria-hidden="true" />
                  {interpolate(t.heritage.travelTo, { place: next.locationName ?? "" })}
                  {s && nextPlace2 && (
                    <Tr text={interpolate(s.t.heritage.travelTo, { place: nextPlace2 })} lang={s.locale} className="text-[0.9375rem] leading-6" />
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </Page>
  );
}

/* 6. Venues --------------------------------------------------------------- */

export function HeritageVenues({ view }: Props) {
  const { locations, schedule, t, heritage: h } = view;
  const s = h.second;
  if (locations.length === 0) return null;

  return (
    <Page id="venues" labelledBy="venues-heading">
      <Reveal>
        <SectionHeading id="venues-heading" hy={t.heritage.venues} translation={s?.t.heritage.venues} lang={s?.locale} />
      </Reveal>

      <div className="mt-12 flex flex-col gap-12">
        {locations.map((location) => {
          const tr = s?.locations[location.id];
          const time = schedule.find((item) => item.locationId === location.id)?.time;
          return (
            <Reveal key={location.id} as="article" className="relative border border-inv-line bg-inv-surface px-5 pb-7 pt-5">
              <Corner className="absolute -left-[7px] -top-[7px]" />
              <Corner rotation={180} className="absolute -bottom-[7px] -right-[7px]" />

              {location.image && <ArchPhoto src={location.image} alt={location.name} aspect="5 / 4" sizes="(min-width: 480px) 358px, 80vw" />}

              <p className={cn("her-label", location.image ? "mt-6" : "mt-3")}>
                <span className="her-label-hy">{t.locations.kinds[location.kind]}</span>
                {s && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span lang={s.locale}>{s.t.locations.kinds[location.kind]}</span>
                  </>
                )}
              </p>
              <h3 className="mt-3 text-[1.5rem] leading-tight text-her-red">
                {location.name}
                <Tr text={tr?.name} primary={location.name} lang={s?.locale} className="mt-1 text-[1.25rem] leading-snug" />
              </h3>
              {location.description && (
                <p className="mt-3 text-[0.9375rem] leading-6 text-inv-muted">
                  {location.description}
                  <Tr text={tr?.description} primary={location.description} lang={s?.locale} className="text-[0.9375rem] leading-6" />
                </p>
              )}
              <p className="mt-3 text-[0.9375rem] leading-6">
                {location.address}
                {time && (
                  <>
                    {" · "}
                    <time>{time}</time>
                  </>
                )}
              </p>
              <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className="her-button mt-6">
                <span>{t.heritage.map}</span>
                {s && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span lang={s.locale}>{s.t.heritage.map}</span>
                  </>
                )}
                <span className="sr-only">: {location.name}</span>
              </a>
            </Reveal>
          );
        })}
      </div>
    </Page>
  );
}

/* 7. Dress code ----------------------------------------------------------- */

export function HeritageDressCode({ view }: Props) {
  const { dressCode, t, heritage: h } = view;
  const s = h.second;
  if (!dressCode) return null;
  const tr = s?.dressCode;

  return (
    <Page id="dress-code" labelledBy="dress-code-heading">
      <Reveal>
        <SectionHeading id="dress-code-heading" hy={t.heritage.dressCode} translation={s?.t.heritage.dressCode} lang={s?.locale} />
      </Reveal>

      {dressCode.image && (
        <Reveal delay={100} className="mx-auto mt-10 w-[72%]">
          <ArchPhoto src={dressCode.image} alt={dressCode.title} sizes="(min-width: 480px) 290px, 72vw" />
        </Reveal>
      )}

      <Reveal delay={150} className="mt-9">
        <h3 className="text-[1.5rem] leading-tight text-her-red">
          {dressCode.title}
          <Tr text={tr?.title} primary={dressCode.title} lang={s?.locale} className="mt-1 text-[1.25rem] leading-snug" />
        </h3>
        {dressCode.description && (
          <>
            <p className="her-body mt-4">{dressCode.description}</p>
            <Tr as="p" text={tr?.description} primary={dressCode.description} lang={s?.locale} className="her-body-tr mt-3" />
          </>
        )}
      </Reveal>

      {dressCode.swatches.length > 0 && (
        <Reveal delay={220} className="mt-11">
          <ul aria-label={t.dressCode.palette} className="flex flex-wrap justify-center gap-x-3 gap-y-8">
            {dressCode.swatches.map((swatch, index) => (
              <li key={`${swatch.hex}-${index}`} className="flex w-[4.25rem] flex-col items-center">
                <span className="mt-2 block h-10 w-10 rotate-45 border border-her-gold p-[3px]" aria-hidden="true">
                  <span className="block h-full w-full border border-black/10" style={{ backgroundColor: swatch.hex }} />
                </span>
                <span className="mt-5 text-[0.875rem] leading-tight">{swatch.name}</span>
                <Tr text={tr?.swatches[index]} primary={swatch.name} lang={s?.locale} className="mt-0.5 text-[0.9375rem] leading-tight" />
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </Page>
  );
}

/* 8. Gallery -------------------------------------------------------------- */

export function HeritageGallery({ view }: Props) {
  const { t, heritage: h } = view;
  const s = h.second;
  const [tall, ...rest] = view.gallery.slice(0, 5);
  if (!tall) return null;
  // An odd photo out spans both columns, so the grid always ends on a full row.
  const odd = rest.length % 2 === 1;

  return (
    <Page id="story" labelledBy="story-heading">
      <Reveal>
        <SectionHeading id="story-heading" hy={t.gallery.eyebrow} translation={s?.t.gallery.eyebrow} lang={s?.locale} />
        <p className="mt-3 text-[0.9375rem] leading-6 text-inv-muted">
          {t.heritage.moments}
          {s && (
            <>
              <span aria-hidden="true"> · </span>
              <span lang={s.locale} className="her-tr">
                {s.t.heritage.moments}
              </span>
            </>
          )}
        </p>
      </Reveal>

      <Reveal variant="image" className="mt-10">
        <ArchPhoto src={tall.src} alt={tall.alt} aspect="3 / 4" placeholder={tall.placeholder} sizes="(min-width: 480px) 400px, 100vw" />
      </Reveal>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {rest.map((image, index) => {
            const wide = odd && index === rest.length - 1;
            const lastRow = index >= rest.length - (odd ? 1 : 2);
            return (
              <figure key={image.id} className={cn("relative", wide && "col-span-2")}>
                <Reveal variant="image" delay={(index % 2) * 120}>
                  <ArchPhoto
                    src={image.src}
                    alt={image.alt}
                    arch={false}
                    aspect={wide ? "16 / 10" : "4 / 5"}
                    placeholder={image.placeholder}
                    sizes={wide ? "(min-width: 480px) 400px, 100vw" : "(min-width: 480px) 200px, 50vw"}
                  />
                </Reveal>
                {/* Set a little further out than on the venue cards, so the inner rule meets the photo's hairline instead of the photo. */}
                {lastRow && (wide || index % 2 === 0) && <Corner rotation={270} className="absolute -bottom-[11px] -left-[11px]" />}
                {lastRow && (wide || index % 2 === 1) && <Corner rotation={180} className="absolute -bottom-[11px] -right-[11px]" />}
              </figure>
            );
          })}
        </div>
      )}
    </Page>
  );
}

/* 10. Closing ------------------------------------------------------------- */

export function HeritageClosing({ view }: Props) {
  const { event, t, heritage: h } = view;
  const s = h.second;

  return (
    <Page as="footer" tone="dark" style={heritageStyle("dark")} className="bg-inv-bg pb-14 text-inv-text">
      <Reveal className="flex justify-center">
        <Monogram tone="dark" size={150} initials={h.initials} />
      </Reveal>

      <Reveal delay={120} className="mt-8">
        <SectionHeading hy={t.heritage.thanks} translation={s?.t.heritage.thanks} lang={s?.locale} tone="dark" />
      </Reveal>

      {event.closingText && (
        <Reveal delay={200} className="mt-6">
          <p className="her-body">
            <Multiline text={event.closingText} />
          </p>
          <Tr as="p" text={s?.closingText} primary={event.closingText} lang={s?.locale} className="her-body-tr mt-3" />
        </Reveal>
      )}

      <Reveal delay={280} className="mt-10">
        <p className="her-signature text-inv-accent">{coupleNames(event.partnerOne, event.partnerTwo, true)}</p>
        <Tr text={secondNames(view)} lang={s?.locale} className="mt-0.5 text-[1.375rem]" />
      </Reveal>

      <p className="mt-14">
        <span className="sr-only">{interpolate(t.final.madeWith, { brand: brand.name })}</span>
        <span className="her-wordmark" aria-hidden="true">
          {brand.name}
        </span>
      </p>
    </Page>
  );
}
