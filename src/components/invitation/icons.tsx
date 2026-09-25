import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Hairline icons for schedule items — keys match SCHEDULE_ICONS. */
const SCHEDULE_ICON_PATHS: Record<string, React.ReactNode> = {
  rings: (
    <>
      <circle cx="9" cy="14" r="5" />
      <circle cx="15" cy="14" r="5" />
      <path d="M10.5 5.5 12 4l1.5 1.5L12 7z" />
    </>
  ),
  church: (
    <>
      <path d="M12 2v4M10.5 3.5h3" />
      <path d="M7 21V11l5-4 5 4v10" />
      <path d="M4 21v-6l3-2M20 21v-6l-3-2" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  glass: (
    <>
      <path d="M8 3h8l-1 7a3 3 0 0 1-6 0z" />
      <path d="M12 13v7M9 21h6" />
    </>
  ),
  dinner: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 9v11M21 4c-1.5 1-2 3-2 5s.5 2 2 2v9" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  cake: (
    <>
      <path d="M4 21h16M5 21v-6h14v6M7 15v-4h10v4" />
      <path d="M12 11V8M12 5.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5z" />
    </>
  ),
  car: (
    <>
      <path d="M3 16v-3l2-5h14l2 5v3z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />,
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
};

export function ScheduleIcon({ name, ...props }: IconProps & { name: string | null }) {
  const paths = name ? SCHEDULE_ICON_PATHS[name] : null;
  if (!paths) return null;
  return <Svg {...props}>{paths}</Svg>;
}

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const PauseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5v14M16 5v14" strokeWidth={1.6} />
  </Svg>
);

export const VolumeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);

export const MuteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Svg>
);

export const ArrowIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
