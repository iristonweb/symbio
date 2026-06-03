"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlowCard } from "@/components/immersive/GlowCard";

export default function AdminImportsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [result, setResult] = React.useState<Record<string, unknown> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const path = dryRun ? "/admin/imports/wargm/dry-run" : "/admin/imports/wargm/run";
      const r = await fetchApi<Record<string, unknown>>(path, {
        method: "POST",
        body: JSON.stringify({
          dry_run: dryRun,
          limit_games: 10,
          limit_projects: 20,
          limit_servers: 15,
        }),
      });
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const reindex = async () => {
    setLoading(true);
    try {
      const r = await fetchApi<{ indexed: Record<string, number> }>("/admin/imports/reindex", { method: "POST" });
      setResult({ reindex: r.indexed });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <Badge tone="warning">{t.admin.importBadge}</Badge>
      <h1 className="text-3xl font-semibold">{t.admin.importTitle}</h1>
      <p className="max-w-2xl text-sm text-fg-muted">{t.admin.importSubtitle}</p>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={loading} onClick={() => run(true)}>
          {t.admin.dryRun}
        </Button>
        <Button disabled={loading} onClick={() => run(false)}>
          {t.admin.runImport}
        </Button>
        <Button variant="outline" disabled={loading} onClick={reindex}>
          {t.admin.reindex}
        </Button>
      </div>

      {error ? <GlowCard className="p-4 text-sm text-red-300">{error}</GlowCard> : null}
      {result ? (
        <GlowCard className="p-4">
          <pre className="overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
        </GlowCard>
      ) : null}
    </div>
  );
}
