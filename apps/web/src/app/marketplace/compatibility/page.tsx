"use client";

import Link from "next/link";
import * as React from "react";
import { fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type GraphNode = {
  id: string;
  slug: string;
  label: string;
  game?: string | null;
  type: string;
  rating: number;
  sales: number;
  confidence: number;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
  note?: string | null;
};

export default function CompatibilityPage() {
  const { t } = useLocale();
  const [game, setGame] = React.useState("");
  const [nodes, setNodes] = React.useState<GraphNode[]>([]);
  const [edges, setEdges] = React.useState<GraphEdge[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    fetchApi<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
      `/marketplace/compatibility/graph${game ? `?game=${encodeURIComponent(game)}` : ""}`
    )
      .then((data) => {
        setNodes(data.nodes);
        setEdges(data.edges);
      })
      .finally(() => setLoading(false));
  }, [game]);

  React.useEffect(() => {
    load();
  }, [load]);

  const edgeBySource = React.useMemo(() => {
    const map = new Map<string, GraphEdge[]>();
    for (const edge of edges) map.set(edge.source, [...(map.get(edge.source) ?? []), edge]);
    return map;
  }, [edges]);

  const nodeById = React.useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  return (
    <div className="space-y-8 pb-14">
      <PageHero
        badge={t.marketplace.badge}
        title={t.marketplace.compatTitle}
        titleAccent={t.marketplace.compatTitleAccent}
        subtitle={t.marketplace.compatSubtitle}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={game} onChange={(e) => setGame(e.target.value)} placeholder={t.marketplace.compatPlaceholder} className="max-w-md" />
          <Button onClick={load}>{t.marketplace.compatRefresh}</Button>
        </div>
      </PageHero>

      {loading ? <p className="text-fg-muted">{t.marketplace.compatLoading}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {nodes.map((node) => {
          const outgoing = edgeBySource.get(node.id) ?? [];
          return (
            <div key={node.id} className="organism-panel relative overflow-hidden rounded-[2rem] p-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info">{node.type}</Badge>
                  {node.game ? <Badge tone="neutral">{node.game}</Badge> : null}
                </div>
                <Link href={`/marketplace/${node.slug}`} className="mt-3 block text-lg font-semibold hover:text-primary">
                  {node.label}
                </Link>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-fg-muted">
                  <span>★ {node.rating.toFixed(1)}</span>
                  <span>{node.sales} sales</span>
                  <span>{Math.round(node.confidence * 100)}% trust</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.round(node.confidence * 100)}%` }}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {outgoing.map((edge) => {
                    const target = nodeById.get(edge.target);
                    return (
                      <div key={edge.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs">
                        <span className={edge.relation === "conflicts" ? "text-red-300" : "text-primary"}>
                          {edge.relation}
                        </span>{" "}
                        → {target?.label ?? edge.target}
                        {edge.note ? <div className="mt-1 text-fg-muted">{edge.note}</div> : null}
                      </div>
                    );
                  })}
                  {!outgoing.length ? <p className="text-xs text-fg-muted">{t.marketplace.compatNoDeps}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
        {!nodes.length && !loading ? (
          <div className="lg:col-span-3">
            <EmptyState
              title={t.marketplace.compatEmpty}
              description={t.marketplace.emptyDesc}
              actionLabel={t.marketplace.emptyAction}
              actionHref="/studio"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
