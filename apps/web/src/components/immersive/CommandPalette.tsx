"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { platformApi } from "@/lib/platform-api";
import { articleTypeLabel, categoryLabel, gameLabel, productTypeLabel } from "@/lib/display-labels";

type Action = {
  label: string;
  hint?: string;
  kbd?: string;
  href: string;
  kind?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const { t } = useLocale();
  const { user } = useAuth();
  const isAdmin = hasRole(user, "admin");
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Action[]>([]);
  const [searching, setSearching] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  const ACTIONS: Action[] = React.useMemo(() => {
    const base: Action[] = [
      { label: t.palette.ecosystem, kbd: "E", href: "/", hint: t.palette.ecosystemHint },
      { label: t.palette.worlds, kbd: "W", href: "/servers", hint: t.palette.worldsHint },
      { label: t.nav.games, href: "/games", hint: t.games.subtitle },
      { label: t.nav.marketplace, href: "/marketplace", hint: t.marketplace.subtitle },
      { label: t.nav.news, href: "/news", hint: t.news.subtitle },
      { label: t.nav.guides, href: "/guides", hint: t.guides.subtitle },
      { label: t.nav.contests, href: "/contests", hint: t.contests.subtitle },
      { label: t.nav.help, href: "/help", hint: t.help.subtitle },
      { label: t.nav.docs, href: "/docs", hint: t.docs.subtitle },
      { label: t.palette.studio, kbd: "A", href: "/studio", hint: t.palette.studioHint },
      { label: t.palette.profile, kbd: "P", href: "/profile", hint: t.palette.profileHint },
    ];
    if (isAdmin) {
      base.push(
        { label: t.palette.admin, kbd: "D", href: "/admin/dashboard", hint: t.palette.adminHint },
        { label: t.palette.audit, href: "/admin/audit", hint: t.palette.auditHint }
      );
    }
    return base;
  }, [t, isAdmin]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  React.useEffect(() => {
    const query = q.trim();
    if (!open || query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      Promise.allSettled([
        platformApi.servers({ q: query, sort: "online" }),
        platformApi.games({ q: query }),
        platformApi.projects({ sort: "rating" }),
        platformApi.articles(),
        platformApi.marketplaceProducts({ q: query }),
      ])
        .then(([servers, games, projects, articles, products]) => {
          if (cancelled) return;
          const next: Action[] = [];

          if (servers.status === "fulfilled") {
            next.push(
              ...servers.value.items.slice(0, 5).map((item) => ({
                label: item.name,
                hint: `${gameLabel(item.game)} · ${item.region ?? t.common.global} · ${item.snapshot?.online ?? 0}/${item.snapshot?.max_players ?? 0}`,
                href: `/servers/${item.id}`,
                kind: "server",
              }))
            );
          }

          if (games.status === "fulfilled") {
            next.push(
              ...games.value.items.slice(0, 4).map((item) => ({
                label: item.title,
                hint: `${categoryLabel(item.category)} · ${item.server_count} ${t.nav.servers}`,
                href: `/games/${item.slug}`,
                kind: "game",
              }))
            );
          }

          if (projects.status === "fulfilled") {
            next.push(
              ...projects.value.items
                .filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 4)
                .map((item) => ({
                  label: item.name,
                  hint: `${item.online_total}/${item.max_players_total} online`,
                  href: `/projects/${item.slug}`,
                  kind: "project",
                }))
            );
          }

          if (articles.status === "fulfilled") {
            next.push(
              ...articles.value.items
                .filter((item) => `${item.title} ${item.excerpt ?? ""}`.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 4)
                .map((item) => ({
                  label: item.title,
                  hint: item.excerpt ?? articleTypeLabel(item.article_type),
                  href: `/news/${item.slug}`,
                  kind: articleTypeLabel(item.article_type),
                }))
            );
          }

          if (products.status === "fulfilled") {
            next.push(
              ...products.value.items.slice(0, 5).map((item) => ({
                label: item.title,
                hint: `${productTypeLabel(item.product_type)} · ${item.is_free ? t.marketplace.free : `${item.price_rub} ₽`} · ★ ${item.rating_avg.toFixed(1)}`,
                href: `/marketplace/${item.slug}`,
                kind: "market",
              }))
            );
          }

          setResults(next.slice(0, 12));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, q, t]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return ACTIONS;
    if (results.length > 0) return results;
    return ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(qq) || (a.hint ?? "").toLowerCase().includes(qq)
    );
  }, [q, ACTIONS, results]);

  const onPick = (a: Action) => {
    setOpen(false);
    router.push(a.href);
  };

  const onMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = dialogRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 z-[80] transition duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onMouseDown={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-[81] flex items-start justify-center px-4 pt-[12vh] transition duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          ref={dialogRef}
          onPointerMove={onMove}
          className="command-palette holo-panel w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/12 shadow-glass"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="border-b border-white/10 px-5 py-4">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.palette.placeholder}
              className="w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {searching ? (
              <li className="px-4 py-3 text-sm text-fg-muted">{t.palette.searchSearching}</li>
            ) : null}
            {filtered.map((a) => (
              <li key={a.href}>
                <button
                  type="button"
                  onClick={() => onPick(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/8"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-fg">
                      {a.kind ? (
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">
                          {a.kind}
                        </span>
                      ) : null}
                      {a.label}
                    </div>
                    {a.hint ? <div className="text-xs text-fg-muted">{a.hint}</div> : null}
                  </div>
                  {a.kbd ? (
                    <span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-fg-muted">
                      {a.kbd}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {!searching && filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-fg-muted">{t.palette.searchEmpty}</li>
            ) : null}
          </ul>
        </div>
      </div>
    </>,
    document.body
  );
}
