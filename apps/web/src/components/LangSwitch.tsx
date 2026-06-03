"use client";

import { useLocale } from "@/components/LocaleProvider";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/translations";

export function LangSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex items-center rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur-xl"
      role="group"
      aria-label={t.lang.switch}
    >
      {(["ru", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "h-9 rounded-xl px-3 text-xs font-medium uppercase tracking-wider transition",
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
