"use client";

import * as React from "react";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
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
  const { t } = useLocale();
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

  return (
    <div className="space-y-8 pb-14">
      <h1 className="text-4xl font-semibold">
        {t.contests.title} <span className="text-gradient">{t.contests.titleAccent}</span>
      </h1>
      {msg ? <p className="text-sm text-primary">{msg}</p> : null}
      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contests.map((c) => (
            <div key={c.id} className="holo-panel rounded-[2rem] p-6">
              <Badge tone="success">{c.status}</Badge>
              <h2 className="mt-3 text-2xl font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{c.prize_summary ?? c.description}</p>
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
