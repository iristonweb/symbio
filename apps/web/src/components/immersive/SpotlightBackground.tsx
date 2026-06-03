"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function SpotlightBackground({ className }: { className?: string }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const onMove = (e: PointerEvent) => {
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 ecosystem-backdrop opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(62,240,255,0.14),transparent_60%),linear-gradient(180deg,rgba(3,5,13,0.18),rgba(3,5,13,0.96)_76%)]" />

      {/* Interactive spotlight */}
      <div
        className="absolute inset-0 opacity-90 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(840px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--primary) / 0.16), rgb(var(--violet) / 0.08), transparent 65%)",
        }}
      />

      {/* Aurora fallback blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 ecosystem-grid opacity-55" />

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines" />

      {/* Noise */}
      <div className="absolute inset-0 noise-overlay" />
    </div>
  );
}
