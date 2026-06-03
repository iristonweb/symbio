"use client";

import * as React from "react";
import { useUiMode } from "@/components/UiModeProvider";
import { cn } from "@/lib/cn";

export function ModeSwitch() {
  const { mode, setMode } = useUiMode();

  return (
    <div className="inline-flex items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-1">
      <button
        type="button"
        onClick={() => setMode("discover")}
        className={cn(
          "h-9 rounded-xl px-3 text-sm font-medium transition",
          mode === "discover"
            ? "bg-[color:var(--card2)] text-[color:var(--fg)] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            : "text-[color:var(--muted)] hover:text-[color:var(--fg)]"
        )}
        aria-pressed={mode === "discover"}
      >
        Discover
      </button>
      <button
        type="button"
        onClick={() => setMode("expert")}
        className={cn(
          "h-9 rounded-xl px-3 text-sm font-medium transition",
          mode === "expert"
            ? "bg-[color:var(--card2)] text-[color:var(--fg)] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            : "text-[color:var(--muted)] hover:text-[color:var(--fg)]"
        )}
        aria-pressed={mode === "expert"}
      >
        Expert
      </button>
    </div>
  );
}
