"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/components/LocaleProvider";

type Action = {
  label: string;
  hint?: string;
  kbd?: string;
  href: string;
};

export function CommandPalette() {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  const ACTIONS: Action[] = React.useMemo(
    () => [
      { label: t.palette.ecosystem, kbd: "E", href: "/", hint: t.palette.ecosystemHint },
      { label: t.palette.worlds, kbd: "W", href: "/servers", hint: t.palette.worldsHint },
      { label: t.palette.studio, kbd: "A", href: "/studio", hint: t.palette.studioHint },
      { label: t.palette.admin, kbd: "D", href: "/admin/dashboard", hint: t.palette.adminHint },
      { label: t.palette.profile, kbd: "P", href: "/profile", hint: t.palette.profileHint },
      { label: t.palette.audit, href: "/admin/audit", hint: t.palette.auditHint },
    ],
    [t]
  );

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
  }, [q, ACTIONS]);

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
            {filtered.map((a) => (
              <li key={a.href}>
                <button
                  type="button"
                  onClick={() => onPick(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/8"
                >
                  <div>
                    <div className="text-sm font-medium text-fg">{a.label}</div>
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
          </ul>
        </div>
      </div>
    </>,
    document.body
  );
}
