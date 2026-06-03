"use client";

import { useLocale } from "@/components/LocaleProvider";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/translations";

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center border border-white/10 bg-black/30 p-0.5 backdrop-blur-xl",
        compact ? "rounded-full" : "rounded-2xl p-1"
      )}
      role="group"
      aria-label={t.lang.switch}
    >
      {(["ru", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "font-medium uppercase tracking-wider transition",
            compact ? "h-7 rounded-full px-2 text-[10px]" : "h-9 rounded-xl px-3 text-xs",
            locale === code
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-fg-muted hover:text-fg"
          )}
          aria-pressed={locale === code}
        >
          {code === "ru" ? t.lang.ru : t.lang.en}
        </button>
      ))}
    </div>
  );
}
