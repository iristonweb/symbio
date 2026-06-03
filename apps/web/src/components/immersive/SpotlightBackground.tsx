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
      {/* Base gradients */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `
            radial-gradient(900px circle at 40% -10%, rgb(var(--primary) / 0.14), transparent 55%),
            radial-gradient(900px circle at 110% 25%, rgb(var(--gold) / 0.1), transparent 60%),
            radial-gradient(900px circle at 30% 120%, rgb(var(--violet) / 0.08), transparent 60%),
            linear-gradient(180deg, rgb(var(--bg)), rgb(4 6 10))
          `,
        }}
      />
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          background: `
            radial-gradient(900px circle at 40% -10%, rgb(var(--primary) / 0.12), transparent 55%),
            radial-gradient(900px circle at 110% 25%, rgb(var(--gold) / 0.08), transparent 60%),
            linear-gradient(180deg, rgb(var(--bg)), rgb(240 244 250))
          `,
        }}
      />

      {/* Interactive spotlight */}
      <div
        className="absolute inset-0 opacity-90 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(720px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--primary) / 0.12), rgb(var(--gold) / 0.06), transparent 65%)",
        }}
      />

      {/* Aurora fallback blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 cyber-grid opacity-40" />

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines" />

      {/* Noise */}
      <div className="absolute inset-0 noise-overlay" />
    </div>
  );
}
