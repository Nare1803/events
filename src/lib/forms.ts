import "server-only";
import { LOCALES } from "@/lib/i18n/locales";
import { serializeLocalized, type LocalizedText } from "@/lib/i18n/localized";
import { cleanText } from "@/lib/validation/sanitize";
import { isUploadFile, removeUpload, storeImage, type StoredImage } from "@/lib/storage";

export const str = (fd: FormData, name: string): string => {
  const value = fd.get(name);
  return typeof value === "string" ? value : "";
};

export const bool = (fd: FormData, name: string): boolean => fd.get(name) === "on" || fd.get(name) === "true";

/** Reads `${name}.hy|en|ru` inputs from <LocalizedField>. */
export function readLocalized(fd: FormData, name: string, maxLength = 2000): LocalizedText {
  const out: LocalizedText = {};
  for (const locale of LOCALES) {
    const value = cleanText(str(fd, `${name}.${locale}`)).slice(0, maxLength);
    if (value) out[locale] = value;
  }
  return out;
}

export const readLocalizedJson = (fd: FormData, name: string, maxLength?: number) => serializeLocalized(readLocalized(fd, name, maxLength));

/**
 * Handles an <ImageField>: a new upload replaces (and deletes) the old file,
 * the "remove" checkbox clears it, otherwise the current value is kept.
 */
export async function resolveImageField(
  fd: FormData,
  name: string,
  current: string | null,
  folder: string,
): Promise<{ url: string | null; stored?: StoredImage }> {
  const file = fd.get(`${name}File`);
  if (isUploadFile(file)) {
    const stored = await storeImage(folder, file);
    if (current) await removeUpload(current);
    return { url: stored.url, stored };
  }
  if (bool(fd, `${name}Remove`)) {
    if (current) await removeUpload(current);
    return { url: null };
  }
  return { url: current };
}
