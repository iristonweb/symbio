"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUiMode } from "@/components/UiModeProvider";
import { useLocale } from "@/components/LocaleProvider";
import { cn } from "@/lib/cn";
import { isExpertModeRoute, withViewParam } from "@/lib/ui-mode";

export function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useUiMode();
  const { t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appliesHere = isExpertModeRoute(pathname);

  const switchMode = (next: "discover" | "expert") => {
    setMode(next);
    if (!appliesHere) return;
    const search = searchParams.toString();
    const href = withViewParam(pathname, search ? `?${search}` : "", next);
    router.replace(href, { scroll: false });
  };

  return (
    <div
      className={cn("inline-flex flex-col", compact ? "gap-0.5" : "gap-1")}
      title={t.mode.scopeHint}
    >
      <div
        className={cn(
          "inline-flex items-center border border-white/10 bg-white/5 p-0.5 backdrop-blur-xl",
          compact ? "rounded-full" : "rounded-2xl p-1"
        )}
      >
        <button
          type="button"
          onClick={() => switchMode("discover")}
          title={t.mode.discoverHint}
          className={cn(
            "font-medium transition",
            compact ? "h-7 rounded-full px-2 text-[11px]" : "h-9 rounded-xl px-3 text-sm",
            mode === "discover"
              ? "bg-white/12 text-fg shadow-glass"
              : "text-fg-muted hover:text-fg"
          )}
          aria-pressed={mode === "discover"}
        >
          {t.mode.discover}
        </button>
        <button
          type="button"
          onClick={() => switchMode("expert")}
          title={t.mode.expertHint}
          className={cn(
            "font-medium transition",
            compact ? "h-7 rounded-full px-2 text-[11px]" : "h-9 rounded-xl px-3 text-sm",
            mode === "expert"
              ? "bg-white/12 text-fg shadow-glass"
              : "text-fg-muted hover:text-fg"
          )}
          aria-pressed={mode === "expert"}
        >
          {t.mode.expert}
        </button>
      </div>
      {mode === "expert" && !appliesHere ? (
        <span className="hidden text-[9px] leading-tight text-amber-200/90 xl:block">{t.mode.scopeHint}</span>
      ) : null}
    </div>
  );
}
