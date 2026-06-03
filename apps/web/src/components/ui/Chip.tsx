"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ className, active, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary/55 bg-primary/15 text-primary shadow-[0_0_24px_rgb(var(--primary)_/_0.15),inset_0_1px_0_rgb(255_255_255/_0.12)]"
          : "border-white/12 bg-white/5 text-fg-muted hover:border-white/22 hover:bg-white/10 hover:text-fg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
