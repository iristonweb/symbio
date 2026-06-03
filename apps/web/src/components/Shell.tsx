"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";
import { ModeSwitch } from "@/components/ModeSwitch";
import { Badge } from "@/components/ui/Badge";

function Icon({ name }: { name: "moon" | "sun" | "spark" | "bolt" }) {
  if (name === "sun")
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  if (name === "moon")
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7.5 7.5 0 1 0 9.8 9.8Z" />
      </svg>
    );
  if (name === "bolt")
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8L12 2Z" />
      <path d="M5 13l.9 2.7L9 17l-3.1 1.1L5 21l-.9-2.9L1 17l3.1-1.3L5 13Z" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(0,245,212,0.95),rgba(180,255,57,0.55),rgba(7,10,15,0))] blur-[0px]" />
        <div className="absolute inset-0 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_16px_45px_rgba(0,0,0,0.25)]" />
        <div className="absolute inset-0 grid place-items-center text-[color:var(--bg)]">
          <Icon name="spark" />
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">SYMBIO</div>
        <div className="text-xs text-[color:var(--muted)]">UGC + Servers + Studio</div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] transition hover:bg-[color:var(--card2)]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Icon name={isDark ? "moon" : "sun"} />
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-[color:var(--card2)] text-[color:var(--fg)] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          : "text-[color:var(--muted)] hover:text-[color:var(--fg)] hover:bg-[rgba(255,255,255,0.03)]"
      )}
    >
      {label}
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [api, setApi] = React.useState<"unknown" | "up" | "down">("unknown");

  React.useEffect(() => {
    let mounted = true;
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${url}/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then(() => {
        if (mounted) setApi("up");
      })
      .catch(() => {
        if (mounted) setApi("down");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(7,10,15,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,245,212,0.35)]">
            <Brand />
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1 md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/servers" label="Servers" />
            <NavLink href="/admin/audit" label="Audit" />
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <ModeSwitch />
            </div>

            <Badge
              tone={api === "up" ? "success" : api === "down" ? "danger" : "neutral"}
              className="hidden sm:inline-flex"
              title={api === "up" ? "API reachable" : api === "down" ? "API not reachable" : "Checking API…"}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  api === "up"
                    ? "bg-[color:var(--accent)]"
                    : api === "down"
                    ? "bg-[rgba(255,80,110,0.95)]"
                    : "bg-[rgba(255,255,255,0.35)]"
                )}
              />
              API {api}
            </Badge>

            <ThemeToggle />

            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] transition hover:bg-[color:var(--card2)]"
            >
              <Icon name="bolt" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          </div>
        </div>

        <div className="md:hidden border-t border-[rgba(255,255,255,0.06)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
            <div className="flex items-center gap-1">
              <NavLink href="/" label="Home" />
              <NavLink href="/servers" label="Servers" />
              <NavLink href="/admin/audit" label="Audit" />
            </div>
            <ModeSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

      <footer className="border-t border-[rgba(255,255,255,0.06)] py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-[color:var(--muted)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[rgba(0,245,212,0.8)]" />
              <span>SYMBIO Sprint 0</span>
            </div>
            <div className="opacity-80">Marketplace • Server Hub • Creator Studio</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
