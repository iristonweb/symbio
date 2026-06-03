"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/cn";

type Action = { label: string; hint?: string; kbd?: string; href?: string; onSelect?: () => void };

const ACTIONS: Action[] = [
  { label: "Home", kbd: "H", href: "/" },
  { label: "Marketplace", kbd: "M", href: "/marketplace", hint: "Browse mods & assets" },
  { label: "Servers", kbd: "S", href: "/servers", hint: "Discover servers & packs" },
  { label: "Creator Studio", kbd: "C", href: "/studio", hint: "Upload & manage releases" },
  { label: "Docs", kbd: "D", href: "/docs", hint: "Roadmap & product notes" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
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
    return ACTIONS.filter((a) => a.label.toLowerCase().includes(qq) || (a.hint ?? "").toLowerCase().includes(qq));
  }, [q]);

  const onPick = (a: Action) => {
    setOpen(false);
    if (a.onSelect) return a.onSelect();
    if (a.href) window.location.assign(a.href);
  };

  const onMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = dialogRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    const y = Math.max(0, Math.min(r.height, e.clientY - r.top));
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 z-[80] transition duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onMouseDown={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <div
        className={cn(
          "fixed left-1/2 top-[10vh] z-[90] w-[min(720px,92vw)] -translate-x-1/2 transition duration-200",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div
          ref={dialogRef}
          onPointerMove={onMove}
          className={cn(
            "relative overflow-hidden rounded-3xl border",
            "bg-[rgb(var(--cy-surface)_/_0.78)] border-[rgb(var(--cy-border))] backdrop-blur-2xl",
            "shadow-[0_28px_120px_rgba(0,0,0,0.45)]",
          )}
        >
          {/* subtle animated sheen */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx,50%) var(--my,40%), rgb(var(--cy-lime) / 0.16), rgb(var(--cy-accent) / 0.12), transparent 65%)",
            }}
          />
          <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:url('/noise.png')] [background-size:320px_320px]" />

          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl grid place-items-center border border-white/10 bg-white/5">
                <span className="text-xs font-semibold tracking-[0.3em] text-gradient">K</span>
              </div>
              <input
                autoFocus={open}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to jump… (Ctrl/⌘ K)"
                className={cn(
                  "h-11 w-full rounded-2xl px-4 text-sm outline-none",
                  "bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] placeholder:text-[rgb(var(--cy-muted))]",
                  "focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filtered[0]) onPick(filtered[0]);
                  }
                }}
              />
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-[rgb(var(--cy-muted))]">
                <kbd className="rounded-md border border-white/10 bg-black/20 px-2 py-1">Esc</kbd>
                <span>close</span>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-[rgb(var(--cy-muted))]">No results.</div>
              ) : (
                <ul className="max-h-[320px] overflow-auto">
                  {filtered.map((a) => (
                    <li key={a.label}>
                      <button
                        className={cn(
                          "group w-full px-4 py-3 flex items-center justify-between text-left",
                          "hover:bg-white/5 focus:outline-none focus:bg-white/5",
                        )}
                        onClick={() => onPick(a)}
                      >
                        <div>
                          <div className="text-sm text-[rgb(var(--cy-text))]">{a.label}</div>
                          {a.hint ? <div className="text-xs text-[rgb(var(--cy-muted))]">{a.hint}</div> : null}
                        </div>
                        {a.kbd ? (
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-[rgb(var(--cy-muted))] group-hover:ring-1 group-hover:ring-[rgb(var(--cy-lime)_/_0.18)]">
                            {a.kbd}
                          </kbd>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[rgb(var(--cy-muted))]">
              <span>Navigate • Search • Jump</span>
              <span className="hidden sm:inline">Tip: type “server” to open Servers</span>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
