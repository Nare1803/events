"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { InvitationView } from "@/types/invitation";
import { cn } from "@/lib/utils/cn";
import { HeritageIntro } from "./heritage/intro";
import { IntroScreen, type IntroPhase } from "./intro-screen";
import { LanguageSwitcher } from "./language-switcher";
import { MusicPlayer, type MusicHandle } from "./music-player";
import { OldMoneyControls } from "./old-money/controls";
import { oldMoneyFontVars } from "./old-money/fonts";
import { OldMoneyIntro } from "./old-money/intro";

type ShellProps = {
  view: Pick<
    InvitationView,
    | "event"
    | "guest"
    | "theme"
    | "t"
    | "locale"
    | "locales"
    | "allowLocaleSwitch"
    | "music"
    | "isPreview"
    | "basePath"
    | "banner"
    | "startOpen"
    | "heritage"
    | "oldMoney"
  >;
  children: ReactNode;
};

const INTRO_DURATION = 1700;
/** Old Money's envelope: seal press, flap, card rise and fade all finish within 1.3s. */
const SEAL_DURATION = 1300;

/** Client wrapper around the server-rendered sections: intro, music, language and open tracking. */
export function InvitationShell({ view, children }: ShellProps) {
  const [phase, setPhase] = useState<IntroPhase>(view.startOpen ? "open" : "closed");
  const music = useRef<MusicHandle>(null);
  const seal = view.theme.intro === "seal" && !!view.oldMoney;

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
    const focusMain = () => document.getElementById("invitation-main")?.focus({ preventScroll: true });
    // Old Money with reduced motion: no envelope animation, straight to the hero.
    if (seal && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      window.requestAnimationFrame(focusMain);
      return;
    }
    setPhase("opening");
    window.setTimeout(() => {
      setPhase("open");
      focusMain();
    }, seal ? SEAL_DURATION : INTRO_DURATION);
  };

  return (
    <div
      lang={view.locale}
      style={view.theme.style}
      data-theme={view.theme.id}
      data-sections={view.theme.sections}
      data-opened={phase !== "closed"}
      // Old Money's fonts are scoped to its invitations; its theme tokens refer to these variables.
      className={cn("inv-root group/inv min-h-dvh", seal && oldMoneyFontVars)}
    >
      <noscript>
        <style>{`[role="dialog"]{display:none!important}.reveal,.reveal-image,.reveal-image>*{opacity:1!important;transform:none!important;clip-path:none!important}[data-opened] .opacity-0{opacity:1!important}`}</style>
      </noscript>

      {view.banner && (
        <p className="fixed inset-x-0 top-0 z-[70] bg-espresso py-1.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ivory">
          {view.banner}
        </p>
      )}

      {seal ? (
        <OldMoneyControls
          locales={view.locales}
          current={view.locale}
          allowSwitch={view.allowLocaleSwitch}
          label={view.t.language.label}
          music={view.music}
          musicRef={music}
          musicT={view.t.music}
          intro={phase !== "open"}
        />
      ) : (
        view.allowLocaleSwitch && (
          // Heritage is always Armenian first; its switcher picks the second language.
          <LanguageSwitcher locales={view.locales} current={view.heritage?.second?.locale ?? view.locale} label={view.t.language.label} />
        )
      )}

      {seal ? (
        <OldMoneyIntro phase={phase} view={view} onOpen={open} />
      ) : view.theme.intro === "monogram" && view.heritage ? (
        <HeritageIntro phase={phase} view={view} onOpen={open} />
      ) : (
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
      )}

      <main id="invitation-main" tabIndex={-1} inert={phase === "closed"} className="outline-none">{children}</main>

      {view.music && !seal && <MusicPlayer ref={music} music={view.music} visible={phase === "open"} t={view.t.music} />}
    </div>
  );
}
