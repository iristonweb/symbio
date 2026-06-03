"use client";

import Link from "next/link";
import type { ApiServer } from "@/lib/platform-api";
import { gameLabel } from "@/lib/display-labels";
import { cn } from "@/lib/cn";

export type ServerExpertTableLabels = {
  server: string;
  game: string;
  region: string;
  mode: string;
  online: string;
  ping: string;
  map: string;
  rank: string;
  rankDelta: string;
  uptime: string;
  load: string;
  rating: string;
  status: string;
  empty: string;
};

function loadPercent(server: ApiServer): number | null {
  const snap = server.snapshot;
  if (!snap || snap.max_players <= 0) return null;
  return Math.round((snap.online / snap.max_players) * 100);
}

function snapshotAgeMinutes(server: ApiServer): number | null {
  if (!server.snapshot?.created_at) return null;
  const age = Date.now() - new Date(server.snapshot.created_at).getTime();
  return Math.floor(age / 60000);
}

export function ServerExpertTable({
  servers,
  labels,
  showRating = true,
  showOwnerStatus = false,
  moderationLabels,
  className,
}: {
  servers: ApiServer[];
  labels: ServerExpertTableLabels;
  showRating?: boolean;
  showOwnerStatus?: boolean;
  moderationLabels?: Record<string, string>;
  className?: string;
}) {
  return (
    <section className={cn("holo-panel rounded-[2rem] p-4", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-fg-muted">
            <tr>
              <th className="px-3 py-3">{labels.server}</th>
              <th className="px-3 py-3">{labels.game}</th>
              <th className="px-3 py-3">{labels.region}</th>
              <th className="px-3 py-3">{labels.mode}</th>
              <th className="px-3 py-3 text-right">{labels.online}</th>
              <th className="px-3 py-3 text-right">{labels.ping}</th>
              <th className="px-3 py-3">{labels.map}</th>
              <th className="px-3 py-3 text-right">{labels.rank}</th>
              <th className="px-3 py-3 text-right">{labels.rankDelta}</th>
              <th className="px-3 py-3 text-right">{labels.uptime}</th>
              <th className="px-3 py-3 text-right">{labels.load}</th>
              {showRating ? <th className="px-3 py-3 text-right">{labels.rating}</th> : null}
              {showOwnerStatus ? <th className="px-3 py-3">{labels.status}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {servers.map((server) => {
              const snap = server.snapshot;
              const load = loadPercent(server);
              const ageMin = snapshotAgeMinutes(server);
              const stale = ageMin != null && ageMin > 120;
              const offline = snap?.status && snap.status !== "online";
              return (
                <tr
                  key={server.id}
                  className={cn(
                    "text-fg-muted transition hover:bg-white/5",
                    offline && "opacity-70",
                    stale && "bg-amber-500/5"
                  )}
                >
                  <td className="px-3 py-3">
                    <Link href={`/servers/${server.id}`} className="font-medium text-fg hover:text-primary">
                      {server.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{gameLabel(server.game)}</td>
                  <td className="px-3 py-3">{server.region ?? "—"}</td>
                  <td className="px-3 py-3">{server.mode ?? "—"}</td>
                  <td className="px-3 py-3 text-right">
                    {snap?.online ?? 0}/{snap?.max_players ?? 0}
                  </td>
                  <td className="px-3 py-3 text-right">{snap?.ping != null ? `${snap.ping} ms` : "—"}</td>
                  <td className="max-w-[8rem] truncate px-3 py-3">{snap?.map ?? "—"}</td>
                  <td className="px-3 py-3 text-right">{snap?.rank ?? "—"}</td>
                  <td className="px-3 py-3 text-right">
                    {snap?.rank_delta != null ? (
                      <span className={snap.rank_delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {snap.rank_delta >= 0 ? "+" : ""}
                        {snap.rank_delta}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {snap?.uptime_percent != null ? `${snap.uptime_percent}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">{load != null ? `${load}%` : "—"}</td>
                  {showRating ? (
                    <td className="px-3 py-3 text-right">{server.rating.toFixed(1)}</td>
                  ) : null}
                  {showOwnerStatus ? (
                    <td className="px-3 py-3 text-xs">
                      {moderationLabels?.[server.moderation_status ?? "pending"] ?? server.moderation_status ?? "—"}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
        {servers.length === 0 ? <div className="p-8 text-center text-fg-muted">{labels.empty}</div> : null}
      </div>
    </section>
  );
}
