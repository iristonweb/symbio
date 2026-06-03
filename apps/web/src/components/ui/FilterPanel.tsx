"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function FilterPanel({
  children,
  className,
  sticky = false,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/10 bg-[rgba(3,5,13,0.78)] p-4 shadow-glass backdrop-blur-2xl sm:p-5",
        sticky && "sticky-below-header z-30",
        className
      )}
    >
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function FilterRow({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 lg:grid-cols-[8rem_1fr] lg:items-start", className)}>
      {label ? (
        <div className="pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}
