"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "premium";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  loadingLabel?: string;
};

const baseStyles =
  "relative inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition will-change-transform " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))] " +
  "disabled:opacity-50 disabled:pointer-events-none select-none overflow-hidden";

const variants: Record<Variant, string> = {
  primary:
    "text-black border border-white/20 " +
    "bg-[linear-gradient(135deg,rgb(var(--primary)_/_0.98)_0%,rgb(var(--accent)_/_0.92)_55%,rgb(var(--gold)_/_0.85)_100%)] " +
    "shadow-[0_12px_40px_rgb(var(--primary)_/_0.22),inset_0_1px_0_rgb(255_255_255/_0.35)] " +
    "hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgb(var(--primary)_/_0.32),inset_0_1px_0_rgb(255_255_255/_0.45)] active:translate-y-0",
  premium:
    "text-fg border border-primary/35 bg-[linear-gradient(160deg,rgba(8,14,28,0.95),rgba(4,8,18,0.98))] " +
    "shadow-[0_0_0_1px_rgb(var(--primary)_/_0.15),0_16px_48px_rgb(var(--primary)_/_0.12),inset_0_1px_0_rgb(255_255_255/_0.12)] " +
    "before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(120deg,rgb(var(--primary)_/_0.12),transparent_45%,rgb(var(--violet)_/_0.1))] before:pointer-events-none " +
    "hover:-translate-y-0.5 hover:border-primary/50 active:translate-y-0",
  secondary:
    "text-fg border border-white/14 bg-surface/75 backdrop-blur-xl " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/_0.08)] hover:bg-white/10 hover:border-white/22 hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "bg-transparent text-fg border border-transparent hover:bg-white/6 hover:border-white/12",
  outline:
    "bg-transparent text-fg border border-white/16 hover:bg-primary/8 hover:border-primary/35 hover:-translate-y-0.5 active:translate-y-0",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px] rounded-[1.1rem]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  loadingLabel,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {isLoading ? (
        <span className="relative z-10 inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          <span className="opacity-90">{loadingLabel ?? "…"}</span>
        </span>
      ) : (
        <span className="relative z-10">{children}</span>
      )}
    </button>
  );
}
