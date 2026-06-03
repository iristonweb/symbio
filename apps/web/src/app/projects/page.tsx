"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { platformApi, type ApiProject } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";
import { FilterPanel, FilterRow } from "@/components/ui/FilterPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { gameLabel } from "@/lib/display-labels";

const SORT_KEYS = [
  { id: "rating", labelKey: "sortRating" as const },
  { id: "votes", labelKey: "sortVotes" as const },
  { id: "online", labelKey: "sortOnline" as const },
];

export default function ProjectsPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const game = searchParams.get("game") ?? undefined;
  const [sort, setSort] = React.useState("rating");
  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    platformApi
      .projects({ game, sort })
      .then((r) => setProjects(r.items))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [game, sort]);

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.projects.badge} title={t.projects.title} titleAccent={t.projects.titleAccent} subtitle={t.projects.subtitle} />

      <FilterPanel>
        <FilterRow label={t.projects.sortLabel}>
        {SORT_KEYS.map((s) => (
          <Chip
            key={s.id}
            active={sort === s.id}
            onClick={() => setSort(s.id)}
          >
            {t.projects[s.labelKey]}
          </Chip>
        ))}
        </FilterRow>
      </FilterPanel>

      {loading ? (
        <Skeleton className="h-64" />
      ) : projects.length === 0 ? (
        <EmptyState
          title={t.projects.emptyTitle}
          description={t.projects.emptyDesc}
          actionLabel={t.projects.emptyAction}
          actionHref="/studio"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="holo-panel rounded-[2rem] p-6">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.game_slugs.slice(0, 3).map((slug) => (
                  <span key={slug} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-fg-muted">
                    {gameLabel(slug)}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-fg-muted">
                <span>
                  {p.online_total}/{p.max_players_total} online
                </span>
                <span>
                  {p.votes} {t.common.votes}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
