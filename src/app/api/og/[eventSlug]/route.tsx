import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { brand } from "@/config/brand";
import { db } from "@/lib/db";
import { getDictionary, isLocale, resolveLocalized, type Locale } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { formatLongDate } from "@/lib/utils/dates";
import { asEnum, EVENT_TYPES } from "@/lib/validation/enums";

export const runtime = "nodejs";

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");
const fontsPromise = Promise.all([
  readFile(path.join(FONT_DIR, "CormorantGaramond-Regular.ttf")),
  readFile(path.join(FONT_DIR, "NotoSerifArmenian-Regular.ttf")),
  readFile(path.join(FONT_DIR, "Manrope-Medium.ttf")),
]);

/** Local hero image → small JPEG data URL (Satori can't decode WebP). */
async function heroDataUrl(src: string | null): Promise<string | null> {
  if (!src || !src.startsWith("/") || src.includes("..")) return null;
  try {
    const file = path.join(process.cwd(), "public", src);
    const jpeg = await sharp(file).resize(480, 630, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

/** 1200×630 social preview used by WhatsApp, Messenger, Telegram, etc. Contains no guest data. */
export async function GET(_request: Request, { params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = /^[a-z0-9-]{1,80}$/.test(eventSlug)
    ? await db.event.findUnique({
        where: { slug: eventSlug },
        select: { status: true, eventType: true, partnerOneName: true, partnerTwoName: true, eventDate: true, timezone: true, defaultLocale: true, heroImage: true },
      })
    : null;
  if (!event || event.status !== "PUBLISHED") return new Response("Not found", { status: 404 });

  const locale: Locale = isLocale(event.defaultLocale) ? event.defaultLocale : "hy";
  const names = displayNames(resolveLocalized(event.partnerOneName, locale), resolveLocalized(event.partnerTwoName, locale));
  const date = formatLongDate(event.eventDate, event.timezone, locale);
  const label = getDictionary(locale).meta.labels[asEnum(EVENT_TYPES, event.eventType, "WEDDING")];
  const [[cormorant, armenian, manrope], hero] = await Promise.all([fontsPromise, heroDataUrl(event.heroImage)]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: brand.colors.ivory, color: brand.colors.espresso }}>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} width={480} height={630} alt="" style={{ objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", flex: 1, padding: 28 }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${brand.colors.taupe}`,
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            <div style={{ fontFamily: "Manrope", fontSize: 18, letterSpacing: 7, textTransform: "uppercase", color: "#6F5D53" }}>{label}</div>
            <div style={{ fontFamily: "Cormorant, NotoArmenian", fontSize: hero ? 84 : 104, lineHeight: 1.05, marginTop: 36 }}>{names}</div>
            <div style={{ width: 1, height: 48, background: brand.colors.taupe, margin: "34px 0" }} />
            <div style={{ fontFamily: "Cormorant, NotoArmenian", fontSize: 36, fontStyle: "italic" }}>{date}</div>
            <div style={{ fontFamily: "Manrope", fontSize: 14, letterSpacing: 6, marginTop: 44, color: brand.colors.mocha }}>{brand.name}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Cormorant", data: cormorant, weight: 400, style: "normal" },
        { name: "NotoArmenian", data: armenian, weight: 400, style: "normal" },
        { name: "Manrope", data: manrope, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
