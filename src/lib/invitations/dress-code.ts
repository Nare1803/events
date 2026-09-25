import { parseLocalized, type LocalizedText } from "@/lib/i18n/localized";

export type Swatch = { hex: string; name: LocalizedText };

const HEX = /^#[0-9a-fA-F]{6}$/;

export function parseSwatches(raw: string | null | undefined): Swatch[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const swatches: Swatch[] = [];
    for (const item of value.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const { hex, name } = item as { hex?: unknown; name?: unknown };
      if (typeof hex !== "string" || !HEX.test(hex)) continue;
      swatches.push({ hex, name: name && typeof name === "object" ? parseLocalized(JSON.stringify(name)) : {} });
    }
    return swatches;
  } catch {
    return [];
  }
}
