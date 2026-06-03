"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ContestDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = String(params.slug);
  const [contest, setContest] = React.useState<Awaited<ReturnType<typeof platformApi.contest>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    platformApi
      .contest(slug)
      .then(setContest)
      .catch(() => setContest(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const join = async () => {
    if (!contest) return;
    setMsg(null);
    try {
      await fetchApi(`/contests/${contest.id}/join`, { method: "POST" });
      setMsg(t.contests.joined);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.contests.signInToJoin);
    }
  };

  if (loading) return <Skeleton className="h-64" />;
  if (!contest) {
    return (
      <EmptyState
        title={t.contests.detailNotFound}
        description={t.contests.emptyDesc}
        actionLabel={t.contests.emptyAction}
        actionHref="/contests"
      />
    );
  }

  return (
    <div className="space-y-10 pb-14">
      <Link href="/contests" className="text-sm text-fg-muted hover:text-primary">
        ← {t.contests.title}
      </Link>
      <PageHero badge={contest.status} title={contest.title} subtitle={contest.description}>
        {contest.prize_summary ? (
          <p className="text-sm">
            <span className="text-fg-muted">{t.contests.prize}: </span>
            <strong>{contest.prize_summary}</strong>
          </p>
        ) : null}
      </PageHero>
      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="info">{t.contests.rules}</Badge>
        <p className="mt-4 text-sm text-fg-muted">{contest.description ?? t.contests.subtitle}</p>
        <Badge tone="neutral" className="mt-6">
          {t.contests.results}: {t.contests.emptyDesc}
        </Badge>
        {msg ? <p className="mt-4 text-sm text-primary">{msg}</p> : null}
        <Button className="mt-6" onClick={join}>
          {t.contests.join}
        </Button>
      </section>
    </div>
  );
}
