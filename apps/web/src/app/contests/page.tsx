"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Contest = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  prize_summary?: string;
  status: string;
  ends_at?: string | null;
};

export default function ContestsPage() {
  const { t, locale } = useLocale();
  const [contests, setContests] = React.useState<Contest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    platformApi
      .contests()
      .then((r) => setContests(r.items as Contest[]))
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, []);

  const join = async (contestId: string) => {
    setMsg(null);
    try {
      await fetchApi(`/contests/${contestId}/join`, { method: "POST" });
      setMsg(t.contests.joined);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.contests.signInToJoin);
    }
  };

  const formatEnds = (iso: string | null | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US");
  };

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.contests.badge} title={t.contests.title} titleAccent={t.contests.titleAccent} subtitle={t.contests.subtitle} />

      {msg ? <p className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary">{msg}</p> : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : contests.length === 0 ? (
        <EmptyState
          title={t.contests.emptyTitle}
          description={t.contests.emptyDesc}
          actionLabel={t.contests.emptyAction}
          actionHref="/news"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contests.map((c) => (
            <div key={c.id} className="holo-panel rounded-[2rem] p-6">
              <Badge tone="success">{c.status}</Badge>
              <h2 className="mt-3 text-2xl font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{c.description}</p>
              {c.prize_summary ? (
                <p className="mt-3 text-sm">
                  <span className="text-fg-muted">{t.contests.prize}: </span>
                  <strong>{c.prize_summary}</strong>
                </p>
              ) : null}
              {c.ends_at ? (
                <p className="mt-1 text-xs text-fg-muted">
                  {t.contests.endsAt}: {formatEnds(c.ends_at)}
                </p>
              ) : null}
              <Button className="mt-4" size="sm" onClick={() => join(c.id)}>
                {t.contests.join}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
