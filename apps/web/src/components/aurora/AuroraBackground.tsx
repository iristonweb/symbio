import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Pure CSS aurora backdrop: no external deps.
 * Uses global keyframes defined in globals.css.
 */
export function AuroraBackground({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
        <div className="aurora-grid" />
        <div className="aurora-noise" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
