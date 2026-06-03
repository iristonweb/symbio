"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition will-change-transform " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "text-black bg-[linear-gradient(90deg,rgb(var(--primary)_/_0.96),rgb(var(--accent)_/_0.9))] " +
    "shadow-[0_14px_45px_rgb(var(--primary)_/_0.2)] hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0",
  secondary:
    "bg-surface/80 text-fg border border-white/12 backdrop-blur-xl " +
    "hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "bg-transparent text-fg border border-transparent hover:bg-white/6 hover:border-white/10",
  outline:
    "bg-transparent text-fg border border-white/14 hover:bg-white/6 hover:border-primary/30",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          <span className="opacity-90">Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
