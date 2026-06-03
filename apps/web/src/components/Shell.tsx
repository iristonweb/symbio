"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ModeSwitch } from "@/components/ModeSwitch";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { SpotlightBackground } from "@/components/immersive/SpotlightBackground";
import { CommandPalette } from "@/components/immersive/CommandPalette";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/servers", label: "Servers" },
  { href: "/studio", label: "Studio" },
  { href: "/docs", label: "Docs" },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-fg transition hover:bg-white/10"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7.5 7.5 0 1 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
        </svg>
      )}
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
        "relative rounded-xl px-3 py-2 text-sm transition",
        active ? "text-fg" : "text-fg-muted hover:text-fg"
      )}
    >
      {active ? (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl border border-primary/25 bg-primary/10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
        />
      ) : null}
      <span className="relative">{label}</span>
    </Link>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgb(var(--primary)),rgb(var(--gold)))] opacity-90 blur-[0px]" />
        <div className="absolute inset-0 grid place-items-center rounded-2xl border border-white/15 bg-black/30 text-xs font-bold text-fg">
          S
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">SYMBIO</div>
        <div className="text-[11px] text-fg-muted">UGC • Servers • Studio</div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [api, setApi] = React.useState<"unknown" | "up" | "down">("unknown");
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${url}/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => mounted && setApi("up"))
      .catch(() => mounted && setApi("down"));
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      <SpotlightBackground />
      <CommandPalette />

      <header
        className={cn(
          "sticky top-0 z-50 transition duration-300",
          scrolled
            ? "border-b border-white/10 bg-bg/80 shadow-glass backdrop-blur-2xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Brand />
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} label={n.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block">
              <ModeSwitch />
            </div>

            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-fg-muted transition hover:bg-white/10 sm:inline-flex"
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                );
              }}
            >
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </button>

            <Badge
              tone={api === "up" ? "success" : api === "down" ? "danger" : "neutral"}
              className="hidden sm:inline-flex"
            >
              <span className="relative flex h-2 w-2">
                {api === "up" ? (
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent opacity-75" />
                ) : null}
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    api === "up"
                      ? "bg-accent"
                      : api === "down"
                      ? "bg-[rgba(255,80,110,0.95)]"
                      : "bg-white/40"
                  )}
                />
              </span>
              API {api}
            </Badge>

            <ThemeToggle />

            <Link href="/auth/login">
              <Button size="sm" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t border-white/8 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-x-auto px-4 py-2">
            <div className="flex items-center gap-0.5">
              {NAV.map((n) => (
                <NavLink key={n.href} href={n.href} label={n.label} />
              ))}
            </div>
            <ModeSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">{children}</main>

      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgb(var(--primary))]" />
              SYMBIO — immersive UGC platform
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
              <Link href="/marketplace" className="hover:text-fg">
                Marketplace
              </Link>
              <Link href="/servers" className="hover:text-fg">
                Servers
              </Link>
              <Link href="/studio" className="hover:text-fg">
                Studio
              </Link>
              <Link href="/docs" className="hover:text-fg">
                Docs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
