"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--primary)] text-[color:var(--bg)] shadow-[0_12px_40px_rgba(0,245,212,0.18)] " +
    "hover:translate-y-[-1px] hover:shadow-[0_18px_55px_rgba(0,245,212,0.22)] active:translate-y-[0px]",
  secondary:
    "bg-[color:var(--card)] text-[color:var(--fg)] border border-[color:var(--border)] " +
    "hover:bg-[color:var(--card2)] hover:translate-y-[-1px] active:translate-y-[0px]",
  ghost:
    "bg-transparent text-[color:var(--fg)] hover:bg-[color:var(--card)] border border-transparent hover:border-[color:var(--border)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
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
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-[color:var(--bg)] border-t-transparent animate-spin" />
          <span className="opacity-90">Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
