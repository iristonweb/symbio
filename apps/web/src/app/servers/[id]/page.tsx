"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, type ApiServer } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ServerProfilePage() {
  const { t } = useLocale();
  const params = useParams();
  const id = params.id as string;
  const [server, setServer] = React.useState<ApiServer | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    platformApi
      .server(id)
      .then(setServer)
      .catch(() => setServer(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-[520px]" />;
  if (!server) return <p className="text-fg-muted">{t.common.notFound}</p>;

  const snap = server.snapshot;
  const population = snap && snap.max_players > 0 ? Math.round((snap.online / snap.max_players) * 100) : 0;
  const join = server.join_url ?? `${server.host}:${server.port}`;

  return (
    <div className="space-y-10 pb-14">
      <section className="banner-server relative min-h-[420px] overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.94),rgba(3,5,13,0.45),rgba(3,5,13,0.86))]" />
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <Badge tone={snap?.status === "online" ? "success" : "neutral"}>{snap?.status ?? "—"}</Badge>
            <Badge tone="info">{server.game}</Badge>
            {server.region ? <Badge tone="neutral">{server.region}</Badge> : null}
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold sm:text-7xl">{server.name}</h1>
          <p className="mt-5 max-w-2xl text-fg-muted">{server.description ?? t.servers.descriptionFallback}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`steam://connect/${join}`}
              className="inline-flex h-11 items-center rounded-2xl bg-primary px-4 text-sm font-medium text-black"
            >
              {t.common.connect}
            </a>
            <Link href="/billing">
              <Button variant="outline">{t.common.promote}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="organism-panel rounded-[2rem] p-5">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">{t.common.players}</div>
          <div className="mt-2 text-3xl font-semibold">
            {snap?.online ?? 0}/{snap?.max_players ?? 0}
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/8">
            <div className="h-full rounded-full bg-primary" style={{ width: `${population}%` }} />
          </div>
        </div>
        <div className="organism-panel rounded-[2rem] p-5">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">{t.common.rank}</div>
          <div className="mt-2 text-3xl font-semibold">#{snap?.rank ?? "—"}</div>
        </div>
        <div className="organism-panel rounded-[2rem] p-5">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">{t.common.uptime}</div>
          <div className="mt-2 text-3xl font-semibold">{snap?.uptime_percent ?? "—"}%</div>
        </div>
        <div className="organism-panel rounded-[2rem] p-5">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">{t.common.votes}</div>
          <div className="mt-2 text-3xl font-semibold">{server.votes}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">{t.common.connection}</Badge>
          <p className="mt-4 font-mono text-lg">{join}</p>
          {snap?.map ? (
            <p className="mt-2 text-sm text-fg-muted">
              {t.common.map}: {snap.map}
            </p>
          ) : null}
          {snap?.version ? (
            <p className="text-sm text-fg-muted">
              {t.common.version}: {snap.version}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-fg-muted">
            {t.common.mode}: {server.mode ?? "—"}
          </p>
        </div>
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">{t.common.links}</Badge>
          <div className="mt-4 space-y-2">
            {Object.entries(server.links || {}).map(([k, v]) => (
              <a key={k} href={v} className="block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                {k}
              </a>
            ))}
            {Object.keys(server.links || {}).length === 0 ? (
              <p className="text-sm text-fg-muted">{t.common.noResults}</p>
            ) : null}
          </div>
          {server.source_url ? (
            <p className="mt-4 text-xs text-fg-muted">
              {t.common.sourceMeta}: {server.source_url}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
