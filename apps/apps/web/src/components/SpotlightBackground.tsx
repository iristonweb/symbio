"use client";

import * as React from "react";
import { cn } from "@/components/cn";

/**
 * Premium Golden/Teal ambient background:
 * - soft aurora (not “neon”)
 * - interactive spotlight (mouse)
 * - subtle grid + scanlines + noise
 */
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
    <div className={cn("pointer-events-none fixed inset-0 -z-10", className)}>
      {/* base: light */}
      <div className="absolute inset-0 block dark:hidden bg-[radial-gradient(900px_circle_at_40%_-10%,rgba(14,180,171,0.16),transparent_55%),radial-gradient(900px_circle_at_110%_25%,rgba(216,167,65,0.12),transparent_60%),linear-gradient(180deg,rgba(248,250,253,1),rgba(241,245,250,1))]" />

      {/* base: dark */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(900px_circle_at_45%_-10%,rgba(20,210,198,0.18),transparent_55%),radial-gradient(900px_circle_at_110%_20%,rgba(244,201,93,0.12),transparent_60%),radial-gradient(900px_circle_at_30%_120%,rgba(20,210,198,0.10),transparent_60%),linear-gradient(180deg,rgba(9,12,16,1),rgba(6,8,12,1))]" />

      {/* interactive spotlight */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(720px circle at var(--mx,50%) var(--my,50%), rgb(var(--cy-lime) / 0.14), rgb(var(--cy-accent) / 0.12), transparent 60%)",
        }}
      />

      {/* grid */}
      <div className="absolute inset-0 opacity-[0.14] [mask-image:radial-gradient(62%_62%_at_50%_40%,black,transparent)]">
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:84px_84px]" />
        <div className="absolute inset-0 block dark:hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-[size:84px_84px]" />
      </div>

      {/* scanlines */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay">
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(to_bottom,rgba(255,255,255,0.20)_1px,transparent_1px)] bg-[size:1px_3px]" />
        <div className="absolute inset-0 block dark:hidden bg-[linear-gradient(to_bottom,rgba(0,0,0,0.16)_1px,transparent_1px)] bg-[size:1px_3px]" />
      </div>

      {/* noise */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay [background-image:url('/noise.png')] [background-size:320px_320px]" />
    </div>
  );
}
