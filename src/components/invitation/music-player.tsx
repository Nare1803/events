"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { MusicView } from "@/types/invitation";
import { cn } from "@/lib/utils/cn";
import { MuteIcon, PlayIcon, VolumeIcon } from "./icons";

export type MusicHandle = { start: () => void };

type MusicPlayerProps = { music: MusicView; visible: boolean; t: Dictionary["music"] };

/**
 * Background music. Never autoplays: `start()` is only called from the
 * "Open invitation" click, which satisfies browser autoplay policies.
 * Pauses while the tab is hidden and resumes when the guest returns.
 */
export const MusicPlayer = forwardRef<MusicHandle, MusicPlayerProps>(function MusicPlayer({ music, visible, t }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const resumeOnVisible = useRef(false);

  useImperativeHandle(ref, () => ({
    start() {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = music.volume;
      audio.play().catch(() => setPlaying(false));
    },
  }));

  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden && !audio.paused) {
        resumeOnVisible.current = true;
        audio.pause();
      } else if (!document.hidden && resumeOnVisible.current) {
        resumeOnVisible.current = false;
        audio.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = music.volume;
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={music.src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center rounded-full border border-inv-line bg-inv-bg/85 text-inv-text shadow-[0_8px_30px_-12px_rgba(41,36,33,0.35)] backdrop-blur-md transition-all duration-700 ease-[var(--ease-editorial)] sm:right-6",
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-hidden={!visible}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          aria-label={playing ? t.pause : t.play}
          aria-pressed={playing}
          tabIndex={visible ? 0 : -1}
          title={music.title ? `${t.nowPlaying}: ${music.title}${music.artist ? ` — ${music.artist}` : ""}` : undefined}
        >
          {playing ? (
            <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
              {[0, 180, 360, 90].map((delay) => (
                <span key={delay} className="eq-bar block h-full w-[2px] bg-current" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
          ) : (
            <PlayIcon size={16} />
          )}
        </button>
        <span className="h-5 w-px bg-inv-line" aria-hidden="true" />
        <button
          type="button"
          onClick={toggleMute}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          aria-label={muted ? t.unmute : t.mute}
          aria-pressed={muted}
          tabIndex={visible ? 0 : -1}
        >
          {muted ? <MuteIcon size={18} /> : <VolumeIcon size={18} />}
        </button>
      </div>
    </>
  );
});
