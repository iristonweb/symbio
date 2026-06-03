"use client";

import * as React from "react";
import { useUiMode } from "@/components/UiModeProvider";
import { cn } from "@/lib/cn";

export function ModeSwitch() {
  const { mode, setMode } = useUiMode();

  return (
    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setMode("discover")}
        className={cn(
          "h-9 rounded-xl px-3 text-sm font-medium transition",
          mode === "discover"
            ? "bg-white/12 text-fg shadow-glass"
            : "text-fg-muted hover:text-fg"
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
            ? "bg-white/12 text-fg shadow-glass"
            : "text-fg-muted hover:text-fg"
        )}
        aria-pressed={mode === "expert"}
      >
        Expert
      </button>
    </div>
  );
}
