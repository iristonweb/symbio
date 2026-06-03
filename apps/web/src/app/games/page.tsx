"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiGame } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

const CATEGORY_KEYS = [
  { id: "", labelKey: "all" as const },
  { id: "client", labelKey: "client" as const },
  { id: "browser", labelKey: "browser" as const },
  { id: "mobile", labelKey: "mobile" as const },
];

export default function GamesPage() {
  const { t } = useLocale();
  const [games, setGames] = React.useState<ApiGame[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [category, setCategory] = React.useState("");
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    platformApi
      .games({ category: category || undefined, q: q || undefined })
      .then((r) => setGames(r.items))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [category, q]);

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.games.badge} title={t.games.title} titleAccent={t.games.titleAccent} subtitle={t.games.subtitle} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.games.searchPlaceholder}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={
                category === c.id
                  ? "rounded-full border border-primary/50 bg-primary/15 px-4 py-2 text-xs text-primary"
                  : "rounded-full border border-white/10 px-4 py-2 text-xs text-fg-muted hover:bg-white/10"
              }
            >
              {t.common[c.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          title={t.games.emptyTitle}
          description={t.games.emptyDesc}
          actionLabel={t.games.emptyAction}
          actionHref="/games"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <Link
              key={g.id}
              href={`/games/${g.slug}`}
              className="holo-panel rounded-[2rem] p-6 transition hover:border-primary/30"
            >
              <Badge tone="neutral">{g.category}</Badge>
              <h2 className="mt-3 text-2xl font-semibold">{g.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{g.short_description}</p>
              <div className="mt-4 text-xs text-fg-muted">
                {t.games.rating} {g.rating.toFixed(1)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
