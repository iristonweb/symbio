"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type AuditEvent = {
  id: string;
  actor: string | null;
  action: string;
  target: string | null;
  details: Record<string, any> | null;
  created_at: string;
};

export default function AuditPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(`${apiUrl}/audit/events?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      setEvents(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
            <Badge tone="neutral">Admin</Badge>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Базовая наблюдаемость: события жизненного цикла и действий администратора.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/auth/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-5">
            <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.10)] p-3 text-sm text-[rgba(255,200,210,0.95)]">
              {error}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Latest events</div>
            <Badge tone="info">{events.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-sm text-[color:var(--muted)]">Loading…</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-[color:var(--muted)]">No events yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[color:var(--muted)]">
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Actor</th>
                    <th className="py-2 pr-4">Target</th>
                    <th className="py-2 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
                      <td className="py-3 pr-4 text-xs text-[color:var(--muted)]">
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone="info">{ev.action}</Badge>
                      </td>
                      <td className="py-3 pr-4">{ev.actor || "—"}</td>
                      <td className="py-3 pr-4 text-[color:var(--muted)]">{ev.target || "—"}</td>
                      <td className="py-3 pr-4">
                        <pre className="max-w-[520px] whitespace-pre-wrap break-words rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2 text-xs text-[color:var(--muted)]">
{JSON.stringify(ev.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
