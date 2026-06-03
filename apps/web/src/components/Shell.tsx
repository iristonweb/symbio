"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ModeSwitch } from "@/components/ModeSwitch";
import { LangSwitch } from "@/components/LangSwitch";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { SpotlightBackground } from "@/components/immersive/SpotlightBackground";
import { CommandPalette } from "@/components/immersive/CommandPalette";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

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
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_180deg,rgb(var(--primary)),rgb(var(--violet)),rgb(var(--accent)),rgb(var(--gold)),rgb(var(--primary)))] opacity-75 blur-md" />
        <div className="absolute inset-0 rounded-full border border-white/15 bg-black/60 shadow-[0_0_32px_rgb(var(--primary)_/_0.3)]" />
        <img
          src="/symbio-logo.png"
          alt="SYMBIO"
          className="relative h-12 w-12 rounded-full object-cover ring-1 ring-white/15"
        />
        <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/25 orbit-ring" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-[0.28em]">SYMBIO</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-fg-muted">{t.brandTagline}</div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [api, setApi] = React.useState<"unknown" | "up" | "down">("unknown");
  const [scrolled, setScrolled] = React.useState(false);

  const NAV = [
    { href: "/", label: t.nav.home },
    { href: "/games", label: t.nav.games },
    { href: "/servers", label: t.nav.servers },
    { href: "/projects", label: t.nav.projects },
    { href: "/news", label: t.nav.news },
    { href: "/contests", label: t.nav.contests },
    { href: "/studio", label: t.nav.studio },
    { href: "/billing", label: t.nav.billing },
  ];

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

  const apiLabel =
    api === "up" ? t.api.online : api === "down" ? t.api.offline : t.api.unknown;

  return (
    <div className="relative min-h-screen">
      <SpotlightBackground />
      <CommandPalette />

      <header
        className={cn(
          "sticky top-0 z-50 transition duration-300",
          scrolled
            ? "border-b border-white/10 bg-[rgba(3,5,13,0.78)] shadow-glass backdrop-blur-2xl"
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

          <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} label={n.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block">
              <ModeSwitch />
            </div>
            <LangSwitch />

            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-fg-muted transition hover:bg-white/10 sm:inline-flex"
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
              {apiLabel}
            </Badge>

            <Link href="/auth/login">
              <Button size="sm" variant="secondary">
                {t.nav.signIn}
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
              {t.footer.tagline}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
              <Link href="/games" className="hover:text-fg">{t.nav.games}</Link>
              <Link href="/projects" className="hover:text-fg">{t.nav.projects}</Link>
              <Link href="/guides" className="hover:text-fg">{t.nav.guides}</Link>
              <Link href="/promocodes" className="hover:text-fg">{t.nav.promocodes}</Link>
              <Link href="/admin/imports" className="hover:text-fg">{t.nav.adminImport}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
