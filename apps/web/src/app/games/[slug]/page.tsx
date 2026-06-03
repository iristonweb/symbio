"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, type ApiGame, type ApiServer } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { categoryLabel } from "@/lib/display-labels";

export default function GameDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const [game, setGame] = React.useState<ApiGame | null>(null);
  const [servers, setServers] = React.useState<ApiServer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([platformApi.game(slug), platformApi.servers({ game: slug, sort: "online" })])
      .then(([g, s]) => {
        setGame(g);
        setServers(s.items);
      })
      .catch(() => {
        setGame(null);
        setServers([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-96" />;
  if (!game) return <p className="text-fg-muted">{t.games.notFound}</p>;

  return (
    <div className="space-y-10 pb-14">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-8 shadow-glass">
        <div className="absolute inset-0 page-hero-banner page-hero-games opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.94),rgba(3,5,13,0.58),rgba(3,5,13,0.9))]" />
        <div className="relative">
        <Badge tone="info">{categoryLabel(game.category)}</Badge>
        <h1 className="mt-4 text-5xl font-semibold">{game.title}</h1>
        <p className="mt-4 max-w-2xl text-fg-muted">{game.short_description}</p>
        <Link href={`/projects?game=${game.slug}`} className="mt-4 inline-block text-sm text-primary hover:underline">
          {t.games.viewProjects} {game.title}
        </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">{t.games.servers}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {servers.map((s) => (
            <Link key={s.id} href={`/servers/${s.id}`} className="organism-panel rounded-[2rem] p-5">
              <div className="flex justify-between">
                <span className="font-semibold">{s.name}</span>
                <Badge tone={s.snapshot?.status === "online" ? "success" : "neutral"}>
                  {s.snapshot?.online ?? 0}/{s.snapshot?.max_players ?? 0}
                </Badge>
              </div>
              {s.snapshot?.map ? (
                <p className="mt-2 text-xs text-fg-muted">
                  {t.common.map}: {s.snapshot.map}
                </p>
              ) : null}
            </Link>
          ))}
          {servers.length === 0 ? (
            <div className="lg:col-span-2">
              <EmptyState
                title={t.games.noServersTitle}
                description={t.games.noServersDesc}
                actionLabel={t.studio.addServer}
                actionHref="/studio"
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
