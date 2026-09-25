import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/* Dashboard design primitives — neutral, compact and accessible. */

const BUTTON_VARIANTS = {
  primary: "bg-espresso text-ivory hover:bg-[#3b3430] disabled:bg-espresso/50",
  secondary: "border border-stone-300 bg-white text-espresso hover:bg-stone-50 disabled:text-stone-400",
  ghost: "text-stone-700 hover:bg-stone-100",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/50",
  "danger-ghost": "text-red-700 hover:bg-red-50 disabled:text-red-700/50",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso disabled:cursor-not-allowed",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    BUTTON_VARIANTS[variant],
  );
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return <button type="button" className={cn(buttonClass(variant, size), className)} {...props} />;
}

export const inputClass =
  "block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-espresso shadow-xs placeholder:text-stone-400 focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/15 disabled:bg-stone-100 aria-[invalid=true]:border-red-600";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-24 leading-6", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClass, "h-10 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-stone-800", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-stone-200 bg-white p-5 sm:p-6", className)} {...props} />;
}

export function CardHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-espresso">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-stone-100 text-stone-700",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  danger: "bg-red-50 text-red-800 ring-red-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/20",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-transparent ring-inset", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-espresso">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <p className="font-medium text-espresso">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
