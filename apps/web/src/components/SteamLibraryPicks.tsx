"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { platformApi, type ApiServer } from "@/lib/platform-api";
import { gameLabel } from "@/lib/display-labels";

export function SteamLibraryPicks() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = React.useState<ApiServer[]>([]);
  const [linked, setLinked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setItems([]);
      setLinked(false);
      return;
    }
    setLoading(true);
    platformApi
      .steamRecommendations()
      .then((r) => {
        setLinked(r.linked);
        setItems(r.items);
      })
      .catch(() => {
        setLinked(false);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading || !linked || items.length === 0) return null;

  return (
    <section className="holo-panel rounded-[2.5rem] p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="success">{t.home.steamPicksBadge}</Badge>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight">{t.home.steamPicksTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t.home.steamPicksDesc}</p>
        </div>
        <Link href="/profile">
          <Button size="sm" variant="outline">
            {t.profile.steamLibraryTitle}
          </Button>
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((server) => {
          const snap = server.snapshot;
          const load =
            snap && snap.max_players > 0 ? Math.min(100, Math.round((snap.online / snap.max_players) * 100)) : 0;
          return (
            <Link
              key={server.id}
              href={`/servers/${server.id}`}
              className="organism-panel rounded-[2rem] p-5 transition hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="info">{gameLabel(server.game)}</Badge>
                  <h3 className="mt-2 truncate text-xl font-semibold">{server.name}</h3>
                  <p className="mt-1 text-xs text-fg-muted">
                    {snap?.online ?? 0}/{snap?.max_players ?? 0} · {load}%
                  </p>
                </div>
                <Badge tone={snap?.status === "online" ? "success" : "neutral"}>{t.home.steamPicksLive}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
