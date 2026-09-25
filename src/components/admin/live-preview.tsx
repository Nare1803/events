"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SAVED_EVENT } from "@/lib/client-events";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "ore:studio:preview";
const PREF_EVENT = "ore:preview-pref";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PREF_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PREF_EVENT, onChange);
  };
}

function readVisible(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "hidden";
  } catch {
    return true;
  }
}

/**
 * Mobile preview of the invitation beside the editor. It re-renders after every
 * successful save and keeps its scroll position, so staff see changes in place.
 */
export function LivePreview({ src, fullScreenHref }: { src: string; fullScreenHref: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollY = useRef(0);
  const visible = useSyncExternalStore(subscribe, readVisible, () => true);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    try {
      scrollY.current = win.scrollY;
      setLoading(true);
      win.location.reload();
    } catch {
      frame.current!.src = src;
    }
  }, [src]);

  useEffect(() => {
    const onSaved = () => window.setTimeout(reload, 150);
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, [reload]);

  const toggle = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, visible ? "hidden" : "shown");
    } catch {
      // Preference is a convenience only.
    }
    window.dispatchEvent(new Event(PREF_EVENT));
  };

  return (
    <aside aria-label="Live mobile preview" className="hidden xl:block">
      <div className="sticky top-20 flex flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between text-xs">
          <span className="font-medium uppercase tracking-wide text-stone-500">Live preview</span>
          <span className="flex gap-3">
            {visible && (
              <button type="button" onClick={reload} className="text-stone-600 underline underline-offset-4 hover:text-espresso">
                Refresh
              </button>
            )}
            <a href={fullScreenHref} target="_blank" rel="noopener noreferrer" className="text-stone-600 underline underline-offset-4 hover:text-espresso">
              Full screen
            </a>
            <button type="button" onClick={toggle} className="text-stone-600 underline underline-offset-4 hover:text-espresso" aria-pressed={!visible}>
              {visible ? "Hide" : "Show"}
            </button>
          </span>
        </div>
        {visible && (
          <div className="relative rounded-[2.6rem] border border-stone-300 bg-espresso p-2.5 shadow-xl">
            <div className="relative h-[720px] w-[340px] overflow-hidden rounded-[2rem] bg-ivory">
              <iframe
                ref={frame}
                src={src}
                title="Invitation preview"
                className="h-full w-full"
                onLoad={() => {
                  setLoading(false);
                  try {
                    frame.current?.contentWindow?.scrollTo(0, scrollY.current);
                  } catch {
                    // cross-origin never happens here, but stay safe
                  }
                }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center bg-ivory/70 text-xs text-stone-500 transition-opacity",
                  loading ? "opacity-100" : "opacity-0",
                )}
                aria-hidden="true"
              >
                Updating…
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
