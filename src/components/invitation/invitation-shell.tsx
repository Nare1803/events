"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { InvitationView } from "@/types/invitation";
import { IntroScreen, type IntroPhase } from "./intro-screen";
import { LanguageSwitcher } from "./language-switcher";
import { MusicPlayer, type MusicHandle } from "./music-player";

type ShellProps = {
  view: Pick<InvitationView, "event" | "guest" | "theme" | "t" | "locale" | "locales" | "allowLocaleSwitch" | "music" | "isPreview" | "basePath" | "banner" | "startOpen">;
  children: ReactNode;
};

const INTRO_DURATION = 1700;

/** Client wrapper around the server-rendered sections: intro, music, language and open tracking. */
export function InvitationShell({ view, children }: ShellProps) {
  const [phase, setPhase] = useState<IntroPhase>(view.startOpen ? "open" : "closed");
  const music = useRef<MusicHandle>(null);

  // Record a privacy-light "opened" event once per browser session.
  useEffect(() => {
    if (view.isPreview) return;
    const key = `ore:opened:${view.basePath}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — still record once for this page view.
    }
    const body = JSON.stringify({ guestSlug: view.guest?.slug });
    fetch(`/api/invitations/${encodeURIComponent(view.event.slug)}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [view.basePath, view.event.slug, view.guest?.slug, view.isPreview]);

  // Lock page scroll while the intro covers the screen.
  useEffect(() => {
    if (phase === "open") return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [phase]);

  const open = () => {
    if (phase !== "closed") return;
    music.current?.start();
    window.scrollTo({ top: 0 });
    setPhase("opening");
    window.setTimeout(() => {
      setPhase("open");
      document.getElementById("invitation-main")?.focus({ preventScroll: true });
    }, INTRO_DURATION);
  };

  return (
    <div
      lang={view.locale}
      style={view.theme.style}
      data-theme={view.theme.id}
      data-opened={phase !== "closed"}
      className="inv-root group/inv min-h-dvh"
    >
      <noscript>
        <style>{`[role="dialog"]{display:none!important}.reveal,.reveal-image,.reveal-image>*{opacity:1!important;transform:none!important;clip-path:none!important}[data-opened] .opacity-0{opacity:1!important}`}</style>
      </noscript>

      {view.banner && (
        <p className="fixed inset-x-0 top-0 z-[70] bg-espresso py-1.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ivory">
          {view.banner}
        </p>
      )}

      {view.allowLocaleSwitch && <LanguageSwitcher locales={view.locales} current={view.locale} label={view.t.language.label} />}

      <IntroScreen
        phase={phase}
        variant={view.theme.intro}
        guestName={view.guest?.name ?? null}
        partnerOne={view.event.partnerOne}
        partnerTwo={view.event.partnerTwo}
        label={view.event.label}
        inviteLine={view.event.inviteLine}
        dotDate={view.event.dotDate}
        dateISO={view.event.dateISO}
        t={view.t}
        onOpen={open}
      />

      <main id="invitation-main" tabIndex={-1} inert={phase === "closed"} className="outline-none">{children}</main>

      {view.music && <MusicPlayer ref={music} music={view.music} visible={phase === "open"} t={view.t.music} />}
    </div>
  );
}
