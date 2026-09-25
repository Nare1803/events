import "server-only";
import { db } from "@/lib/db";
import { THEMES, type ThemeTokens } from "@/lib/themes";

export type CatalogueTemplate = {
  id: string;
  key: string;
  name: string;
  description: string;
  isPublic: boolean;
  sortOrder: number;
  /** Presentation exists in code. */
  implemented: boolean;
  /** Customers can choose it (implemented and public). */
  available: boolean;
  tokens: ThemeTokens;
  heroVariant: string;
};

/**
 * Template catalogue = database rows (naming, visibility, order) joined with
 * the code registry (presentation). Anything not implemented is never selectable.
 */
export async function listTemplates({ publicOnly }: { publicOnly: boolean }): Promise<CatalogueTemplate[]> {
  const rows = await db.template.findMany({ where: publicOnly ? { isPublic: true } : {}, orderBy: { sortOrder: "asc" } });
  return rows.map((row) => {
    const theme = THEMES.find((t) => t.id === row.key);
    const implemented = !!theme?.available;
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      isPublic: row.isPublic,
      sortOrder: row.sortOrder,
      implemented,
      available: implemented && row.isPublic,
      tokens: (theme ?? THEMES[0]).tokens,
      heroVariant: (theme ?? THEMES[0]).variants.hero,
    };
  });
}

export async function listActivePackages() {
  const rows = await db.servicePackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((p) => ({ ...p, features: parseFeatures(p.features) }));
}

export function parseFeatures(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function formatPrice(amount: number | null, currency: string): string | null {
  if (amount == null) return null;
  return `${new Intl.NumberFormat("en-US").format(amount)} ${currency}`;
}
