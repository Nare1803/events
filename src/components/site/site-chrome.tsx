import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6">
        <Link href="/" className="font-serif text-2xl tracking-[0.24em]">
          {brand.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 text-[0.6875rem] font-medium uppercase tracking-[0.24em] md:flex">
          <Link href="/designs" className="underline-offset-8 hover:underline">
            {site.nav.designs}
          </Link>
          <Link href="/#how" className="underline-offset-8 hover:underline">
            {site.nav.how}
          </Link>
          <Link href="/#packages" className="underline-offset-8 hover:underline">
            {site.nav.packages}
          </Link>
        </nav>
        <Link
          href="/create"
          className="inline-flex min-h-11 items-center border border-espresso px-5 text-[0.625rem] font-medium uppercase tracking-[0.24em] transition-colors hover:bg-espresso hover:text-ivory"
        >
          {site.nav.cta}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-espresso/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-10 text-sm text-[#665449]">
        <div>
          <p className="font-serif text-2xl tracking-[0.24em] text-espresso">{brand.name}</p>
          <p className="mt-2">{site.footer.studio}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/designs" className="hover:underline">
            {site.nav.designs}
          </Link>
          <a href={`mailto:${brand.supportEmail}`} className="hover:underline">
            {brand.supportEmail}
          </a>
          <Link href="/login" className="hover:underline">
            {site.footer.studioLogin}
          </Link>
          <span>
            © {new Date().getFullYear()} {brand.copyrightHolder}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Shared editorial CTA button styles for the public site. */
export const ctaPrimary =
  "inline-flex min-h-12 items-center justify-center border border-espresso bg-espresso px-8 text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-ivory transition-colors hover:bg-transparent hover:text-espresso";
export const ctaSecondary =
  "inline-flex min-h-12 items-center justify-center border border-espresso px-8 text-[0.6875rem] font-medium uppercase tracking-[0.28em] transition-colors hover:bg-espresso hover:text-ivory";
