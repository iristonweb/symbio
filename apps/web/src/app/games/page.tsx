"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiGame } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { FilterPanel, FilterRow } from "@/components/ui/FilterPanel";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { categoryLabel } from "@/lib/display-labels";

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

      <FilterPanel>
        <FilterRow label={t.common.search}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.games.searchPlaceholder}
          className="h-12 w-full"
        />
        </FilterRow>
        <FilterRow label={t.games.categoryLabel}>
          {CATEGORY_KEYS.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {t.common[c.labelKey]}
            </Chip>
          ))}
        </FilterRow>
      </FilterPanel>

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
              <Badge tone="neutral">{categoryLabel(g.category)}</Badge>
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
