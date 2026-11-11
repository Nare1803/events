"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { MusicView } from "@/types/invitation";

export type MusicHandle = { start: () => void };

type MusicPlayerProps = {
  music: MusicView;
  t: Dictionary["music"];
  /** Fade the volume in over this many ms when the intro starts the music (Romantic Film). */
  fadeInMs?: number;
  className?: string;
};

function NoteIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M7 4.2 L16 2.5 V13.2 A2.3 2.3 0 1 1 14.6 11.1 V6.1 L8.4 7.3 V15 A2.3 2.3 0 1 1 7 12.9 Z" />
    </svg>
  );
}

/**
 * Background music. Never autoplays: `start()` is only called from the
 * "Open invitation" click, which satisfies browser autoplay policies.
 * Pauses while the tab is hidden and resumes when the guest returns.
 * A single round play/pause button; the parent control set places and styles it.
 */
export const MusicPlayer = forwardRef<MusicHandle, MusicPlayerProps>(function MusicPlayer({ music, t, fadeInMs = 0, className }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const resumeOnVisible = useRef(false);

  useImperativeHandle(ref, () => ({
    start() {
      const audio = audioRef.current;
      if (!audio) return;
      if (fadeInMs <= 0) {
        audio.volume = music.volume;
        audio.play().catch(() => setPlaying(false));
        return;
      }
      // Ramp up from silence. (iOS ignores scripted volume; there it simply plays.)
      audio.volume = 0;
      const begin = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - begin) / fadeInMs);
        audio.volume = music.volume * progress;
        if (progress < 1 && !audio.paused) window.requestAnimationFrame(step);
      };
      audio
        .play()
        .then(() => window.requestAnimationFrame(step))
        .catch(() => setPlaying(false));
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

  const audio = (
    <audio
      ref={audioRef}
      src={music.src}
      loop
      preload="none"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    />
  );

  return (
    <>
      {audio}
      <button
        type="button"
        onClick={toggle}
        className={className}
        aria-label={playing ? t.pause : t.play}
        aria-pressed={playing}
        title={music.title ? `${t.nowPlaying}: ${music.title}${music.artist ? ` — ${music.artist}` : ""}` : undefined}
      >
        {playing ? (
          <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
            {[0, 180, 360, 90].map((delay) => (
              <span key={delay} className="eq-bar block h-full w-[2px] bg-current" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </span>
        ) : (
          <NoteIcon />
        )}
      </button>
    </>
  );
});
