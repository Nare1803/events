import { brand } from "@/config/brand";

/** Quiet placeholder while the invitation is fetched on slow connections. */
export default function InvitationLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <span className="animate-pulse font-serif text-4xl font-light italic text-taupe" aria-hidden="true">
        {brand.logoMark}
      </span>
    </div>
  );
}
