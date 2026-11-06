import Image from "next/image";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { OrnamentTone } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import { Frame } from "./ornaments";

/** One manuscript page: a section with the Frame drawn behind it. */
export function Page({
  id,
  labelledBy,
  tone = "light",
  as: Tag = "section",
  className,
  style,
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: OrnamentTone;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag id={id} aria-labelledby={labelledBy} className={cn("relative isolate px-10 pb-[4.5rem] pt-20 text-center", className)} style={style}>
      <Frame tone={tone} className="absolute inset-0 -z-10" />
      {children}
    </Tag>
  );
}

/**
 * The second-language line under an Armenian line. Renders nothing when the
 * translation is missing or identical to the Armenian (e.g. an untranslated name).
 */
export function Tr({
  text,
  primary,
  lang,
  as: Tag = "span",
  className,
}: {
  text: string | null | undefined;
  primary?: string;
  lang: string | null | undefined;
  as?: ElementType;
  className?: string;
}) {
  if (!text || !lang || text.trim() === primary?.trim()) return null;
  return (
    <Tag lang={lang} className={cn("her-tr block", className)}>
      {text}
    </Tag>
  );
}

/** "Աննա և Դավիթ" in Armenian; "Anna & David" for the second language. */
export function coupleNames(one: string, two: string, armenian: boolean): string {
  if (!two.trim()) return one;
  return armenian ? `${one} և ${two}` : `${one} & ${two}`;
}

/** Entrance animation tied to the intro opening (see the shell's data-opened). */
export const enter = (delay: number, className = "") => ({
  className: `opacity-0 group-data-[opened=true]/inv:animate-rise ${className}`,
  style: { animationDelay: `${delay}ms` },
});

/**
 * Photo with an arch top. `outline="double"` is the hero's gold-then-red
 * frame; `"hairline"` is a single gold rule. Only photos get rounded corners.
 */
export function ArchPhoto({
  src,
  alt = "",
  aspect = "3 / 4",
  sizes,
  outline = "hairline",
  arch = true,
  preload,
  placeholder,
  className,
}: {
  src: string;
  alt?: string;
  aspect?: string;
  sizes: string;
  outline?: "double" | "hairline";
  arch?: boolean;
  preload?: boolean;
  placeholder?: string | null;
  className?: string;
}) {
  const round = arch ? "rounded-t-full" : undefined;
  const photo = (
    <div className={cn("relative overflow-hidden bg-inv-surface", round)} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={alt}
        fill
        preload={preload}
        sizes={sizes}
        quality={80}
        className="object-cover"
        placeholder={placeholder ? "blur" : "empty"}
        blurDataURL={placeholder ?? undefined}
      />
    </div>
  );
  if (outline === "double") {
    return (
      <div className={cn("border border-her-gold p-[5px]", round, className)}>
        <div className={cn("border border-her-red p-[3px]", round)}>{photo}</div>
      </div>
    );
  }
  return <div className={cn("border border-her-gold p-[3px]", round, className)}>{photo}</div>;
}
