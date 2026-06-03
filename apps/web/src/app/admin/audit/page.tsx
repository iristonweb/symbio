"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Skeleton } from "@/components/ui/Skeleton";

type AuditEvent = {
  id: string;
  actor: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export default function AuditPage() {
  const { t } = useLocale();
  const { logout } = useAuth();
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
      const res = await fetch(`${apiUrl}/admin/audit?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvents(
        (data.items ?? []).map((ev: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          meta: Record<string, unknown> | null;
          created_at: string;
        }) => ({
          id: ev.id,
          actor: ev.actor_user_id,
          action: ev.action,
          target: ev.entity_type ? `${ev.entity_type}:${ev.entity_id ?? ""}` : null,
          details: ev.meta,
          created_at: ev.created_at,
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="neutral">
          <span className="text-gradient font-semibold tracking-[0.12em]">AUDIT</span>
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {t.admin.auditTitle} <span className="text-gradient">{t.admin.auditTitleAccent}</span>
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{t.admin.auditSubtitle}</p>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={load} disabled={loading}>
          {t.common.refresh}
        </Button>
        <Button variant="ghost" onClick={logout}>
          {t.nav.signOut}
        </Button>
      </div>

      {error ? (
        <GlowCard className="p-5">
          <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.1)] p-3 text-sm text-[rgba(255,200,210,0.95)]">
            {error}
          </div>
        </GlowCard>
      ) : null}

      <GlowCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <SectionTitle title={t.admin.latestEvents} subtitle={t.admin.stream} />
          <Badge tone="info">{events.length}</Badge>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">{t.admin.noEvents}</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-primary/20 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge tone="info">{ev.action}</Badge>
                    <span className="text-xs text-fg-muted">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-fg-muted">{t.admin.actor}: </span>
                      <span className="text-fg">{ev.actor || "—"}</span>
                    </div>
                    <div>
                      <span className="text-fg-muted">{t.admin.target}: </span>
                      <span className="text-fg">{ev.target || "—"}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </GlowCard>
    </div>
  );
}
