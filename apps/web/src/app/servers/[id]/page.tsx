"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { platformApi, type ApiServer, type VoteResult } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";

export default function ServerProfilePage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [server, setServer] = React.useState<ApiServer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [voteBusy, setVoteBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [identities, setIdentities] = React.useState<{ vote_multiplier: number; social_providers: string[] } | null>(
    null
  );

  React.useEffect(() => {
    if (!id) return;
    platformApi
      .server(id)
      .then(setServer)
      .catch(() => setServer(null))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    if (!user) return;
    platformApi.authIdentities().then(setIdentities).catch(() => setIdentities(null));
  }, [user]);

  const vote = async () => {
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(`/servers/${id}`)}`);
      return;
    }
    setVoteBusy(true);
    setToast(null);
    try {
      const r: VoteResult = await platformApi.voteServer(id);
      setServer((s) => (s ? { ...s, votes: r.votes } : s));
      if (r.rewarded && r.earned_tokens > 0) {
        setToast(t.rewards.voteSuccess.replace("{n}", String(r.earned_tokens)).replace("{m}", String(r.multiplier)));
      } else if (!r.email_verified) {
        setToast(t.rewards.voteNoRewardVerify);
      } else {
        setToast(t.rewards.voteRecorded);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t.rewards.voteFailed;
      setToast(msg);
    } finally {
      setVoteBusy(false);
    }
  };

  const startOAuth = async (provider: "google" | "steam") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const r = await fetch(`${apiUrl}/auth/${provider}/start`);
    const data = await r.json();
    window.location.href = data.url;
  };

  if (loading) return <Skeleton className="h-[520px]" />;
  if (!server) return <p className="text-fg-muted">{t.common.notFound}</p>;

  const snap = server.snapshot;
  const population = snap && snap.max_players > 0 ? Math.round((snap.online / snap.max_players) * 100) : 0;
  const join = server.join_url ?? `${server.host}:${server.port}`;
  const mult = identities?.vote_multiplier ?? 1;

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
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <a
                href={`steam://connect/${join}`}
                className="inline-flex h-11 items-center rounded-2xl bg-primary px-4 text-sm font-medium text-black"
              >
                {t.common.connect}
              </a>
              <Button variant="premium" isLoading={voteBusy} onClick={vote}>
                {t.rewards.voteCta}
              </Button>
              <Link href={`/billing?server=${id}`}>
                <Button variant="outline">{t.common.promote}</Button>
              </Link>
            </div>
            <p className="text-xs text-fg-muted">
              {t.rewards.voteHint.replace("{m}", String(mult))} · {t.servers.promoteHint}
            </p>
            {user && identities && identities.social_providers.length < 2 ? (
              <div className="flex flex-wrap gap-2">
                {!identities.social_providers.includes("google") ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => startOAuth("google")}>
                    {t.rewards.linkGoogle}
                  </Button>
                ) : null}
                {!identities.social_providers.includes("steam") ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => startOAuth("steam")}>
                    {t.rewards.linkSteam}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}
