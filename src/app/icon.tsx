import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon generated from the brand config, so renaming the brand updates it too. */
export default async function Icon() {
  const font = await readFile(path.join(process.cwd(), "src", "assets", "fonts", "CormorantGaramond-Regular.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.colors.espresso,
          color: brand.colors.ivory,
          fontFamily: "Cormorant",
          fontSize: 50,
          borderRadius: 14,
          paddingBottom: 4,
        }}
      >
        {brand.logoMark}
      </div>
    ),
    { ...size, fonts: [{ name: "Cormorant", data: font, weight: 400, style: "normal" }] },
  );
}
