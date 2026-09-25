"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** "fade" lifts content in; "image" unveils with a clip-path wipe. */
  variant?: "fade" | "image";
  delay?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Reveals its children once when they scroll into view. Content is visible
 * without JavaScript thanks to the <noscript> style in InvitationExperience,
 * and reduced-motion users see it immediately (see globals.css).
 */
export function Reveal({ children, as: Tag = "div", variant = "fade", delay = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(variant === "image" ? "reveal-image" : "reveal", visible && "is-visible", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
