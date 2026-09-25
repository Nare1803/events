import Image from "next/image";
import type { InvitationView } from "@/types/invitation";
import { Reveal } from "./reveal";
import { Section } from "./section";

/**
 * Editorial composition: each position has its own column span and vertical
 * offset on a 6-column (mobile) / 12-column (desktop) grid. Every figure keeps
 * the photo's intrinsic aspect ratio, so nothing shifts while images load.
 */
const LAYOUT = [
  { cls: "col-start-1 col-span-6 md:col-start-1 md:col-span-7", sizes: "(min-width: 768px) 55vw, 100vw" },
  { cls: "col-start-3 col-span-4 md:col-start-9 md:col-span-4 md:mt-56", sizes: "(min-width: 768px) 30vw, 66vw" },
  { cls: "col-start-1 col-span-4 md:col-start-2 md:col-span-4 md:mt-20", sizes: "(min-width: 768px) 30vw, 66vw" },
  { cls: "col-start-2 col-span-5 md:col-start-7 md:col-span-6 md:-mt-8", sizes: "(min-width: 768px) 45vw, 83vw" },
  { cls: "col-start-1 col-span-6 md:col-start-3 md:col-span-8", sizes: "(min-width: 768px) 65vw, 100vw" },
  { cls: "col-start-1 col-span-3 md:col-start-1 md:col-span-5", sizes: "(min-width: 768px) 40vw, 50vw" },
  { cls: "col-start-4 col-span-3 mt-16 md:col-start-7 md:col-span-5 md:mt-40", sizes: "(min-width: 768px) 40vw, 50vw" },
  { cls: "col-start-2 col-span-5 md:col-start-4 md:col-span-6", sizes: "(min-width: 768px) 50vw, 83vw" },
];

export function Gallery({ view }: { view: InvitationView }) {
  const images = view.gallery.slice(0, LAYOUT.length);
  if (images.length === 0) return null;

  return (
    <Section id="story" eyebrow={view.t.gallery.eyebrow} tone="surface" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-6 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-12 md:gap-y-16">
        {images.map((image, index) => {
          const layout = LAYOUT[index];
          return (
            <figure key={image.id} className={layout.cls}>
              <Reveal variant="image" delay={(index % 2) * 140}>
                <div className="relative w-full overflow-hidden bg-inv-bg" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={layout.sizes}
                    quality={80}
                    className="object-cover"
                    placeholder={image.placeholder ? "blur" : "empty"}
                    blurDataURL={image.placeholder ?? undefined}
                  />
                </div>
              </Reveal>
            </figure>
          );
        })}
      </div>
    </Section>
  );
}
