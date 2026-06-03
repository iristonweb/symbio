"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type Action = {
  label: string;
  hint?: string;
  kbd?: string;
  href: string;
};

const ACTIONS: Action[] = [
  { label: "Ecosystem command center", kbd: "E", href: "/", hint: "Hero, radar, live organisms" },
  { label: "Worlds listing", kbd: "W", href: "/servers", hint: "Search and filter living servers" },
  { label: "Neon Frontier profile", kbd: "N", href: "/servers/neon-frontier", hint: "Rich media, lore, stats, events" },
  { label: "Add server", kbd: "A", href: "/studio", hint: "Create project and publish world" },
  { label: "Admin command dashboard", kbd: "D", href: "/admin/dashboard", hint: "Analytics, retention, votes" },
  { label: "Player profile", kbd: "P", href: "/profile", hint: "Recommendations and community snapshot" },
  { label: "Audit log", href: "/admin/audit", hint: "Admin audit events" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

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

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return ACTIONS;
    return ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(qq) || (a.hint ?? "").toLowerCase().includes(qq)
    );
  }, [q]);

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
          "fixed left-1/2 top-[12vh] z-[90] w-[min(720px,92vw)] -translate-x-1/2 transition duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div
          ref={dialogRef}
          onPointerMove={onMove}
          className="glass-strong relative overflow-hidden rounded-3xl shadow-glow-lg"
        >
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx, 50%) var(--my, 40%), rgb(var(--primary) / 0.14), transparent 65%)",
            }}
          />
          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <span className="text-xs font-semibold tracking-[0.3em] text-gradient">K</span>
              </div>
              <input
                autoFocus={open}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump anywhere… (Ctrl/⌘ K)"
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) {
                    e.preventDefault();
                    onPick(filtered[0]);
                  }
                }}
              />
            </div>

            <ul className="mt-3 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/20">
              {filtered.length === 0 ? (
                <li className="p-4 text-sm text-fg-muted">No results.</li>
              ) : (
                filtered.map((a) => (
                  <li key={a.href}>
                    <button
                      type="button"
                      className="group flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                      onClick={() => onPick(a)}
                    >
                      <div>
                        <div className="text-sm text-fg">{a.label}</div>
                        {a.hint ? (
                          <div className="text-xs text-fg-muted">{a.hint}</div>
                        ) : null}
                      </div>
                      {a.kbd ? (
                        <kbd className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-fg-muted">
                          {a.kbd}
                        </kbd>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
