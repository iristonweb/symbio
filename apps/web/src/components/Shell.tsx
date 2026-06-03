"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ModeSwitch } from "@/components/ModeSwitch";
import { LangSwitch } from "@/components/LangSwitch";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { SpotlightBackground } from "@/components/immersive/SpotlightBackground";
import { CommandPalette } from "@/components/immersive/CommandPalette";
import { platformApi } from "@/lib/platform-api";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "relative shrink-0 rounded-xl px-2.5 py-2 text-xs transition xl:px-3 xl:text-sm",
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
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-14 w-14 shrink-0">
        <div className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_180deg,rgb(var(--primary)),rgb(var(--violet)),rgb(var(--accent)),rgb(var(--gold)),rgb(var(--primary)))] opacity-85 blur-md" />
        <div className="absolute inset-0 rounded-full border border-white/15 bg-black/60 shadow-[0_0_32px_rgb(var(--primary)_/_0.3)]" />
        <Image
          src="/symbio-logo.svg"
          alt="SYMBIO"
          width={56}
          height={56}
          className="relative h-14 w-14 rounded-full object-contain p-0.5 ring-1 ring-white/15"
          priority
        />
        <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/25 orbit-ring" />
      </div>
      <div className="leading-tight min-w-0">
        <div className="text-base font-semibold tracking-[0.26em] text-fg">SYMBIO</div>
        <div className="hidden max-w-[8.5rem] truncate text-[10px] uppercase tracking-[0.2em] text-fg-muted sm:block">
          {t.brandTagline}
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const { user, logout, loading } = useAuth();
  const [api, setApi] = React.useState<"unknown" | "up" | "down">("unknown");
  const [tokenBalance, setTokenBalance] = React.useState<number | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const NAV_PUBLIC = [
    { href: "/", label: t.nav.home },
    { href: "/games", label: t.nav.games },
    { href: "/servers", label: t.nav.servers },
    { href: "/marketplace", label: t.nav.marketplace },
    { href: "/projects", label: t.nav.projects },
    { href: "/news", label: t.nav.news },
    { href: "/guides", label: t.nav.guides },
    { href: "/contests", label: t.nav.contests },
    { href: "/billing", label: t.nav.billing },
  ];

  const nav = [...NAV_PUBLIC];
  if (user && (hasRole(user, "creator") || hasRole(user, "site_owner"))) {
    nav.push({ href: "/studio", label: t.nav.studio });
  }
  if (user && hasRole(user, "admin")) {
    nav.push({ href: "/admin/dashboard", label: t.nav.admin });
  }

  const isCreator = Boolean(user && (hasRole(user, "creator") || hasRole(user, "site_owner")));

  React.useEffect(() => {
    let mounted = true;
    fetch(`${apiUrl}/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => mounted && setApi("up"))
      .catch(() => mounted && setApi("down"));
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  React.useEffect(() => {
    if (!user) {
      setTokenBalance(null);
      return;
    }
    platformApi.tokenWallet().then((w) => setTokenBalance(w.balance_tokens)).catch(() => setTokenBalance(null));
  }, [user]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(el);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, [user, loading]);

  const apiLabel =
    api === "up" ? t.api.online : api === "down" ? t.api.offline : t.api.unknown;

  const startOAuth = async (provider: "google" | "steam") => {
    const r = await fetch(`${apiUrl}/auth/${provider}/start`);
    const data = await r.json();
    window.location.href = data.url;
  };

  return (
    <div className="relative min-h-screen">
      <SpotlightBackground />
      <CommandPalette />

      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 transition duration-300",
          scrolled
            ? "border-b border-white/10 bg-[rgba(3,5,13,0.78)] shadow-glass backdrop-blur-2xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex w-full max-w-[1480px] items-center gap-3 px-3 py-3 sm:px-4">
          <Link
            href="/"
            className="shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Brand />
          </Link>

          <nav className="nav-scroll hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl lg:flex">
            {nav.map((n) => (
              <NavLink key={n.href} href={n.href} label={n.label} />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden xl:block">
              <ModeSwitch />
            </div>
            <LangSwitch />

            <Badge
              tone={api === "up" ? "success" : api === "down" ? "danger" : "neutral"}
              className="hidden sm:inline-flex"
            >
              {apiLabel}
            </Badge>

            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-fg-muted transition hover:bg-white/10 md:inline-flex"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
              }}
            >
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </button>

            {!loading && user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {tokenBalance !== null ? (
                  <Link
                    href="/billing"
                    className="hidden rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary 2xl:inline-flex"
                  >
                    {tokenBalance} {t.rewards.tokens}
                  </Link>
                ) : null}
                <Link
                  href="/profile"
                  className="hidden max-w-[7rem] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-fg-muted hover:text-fg lg:block"
                >
                  @{user.nickname}
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={logout}
                  className="inline-flex px-3"
                  aria-label={t.nav.signOut}
                >
                  {t.nav.signOut}
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" variant="premium" className="px-3">
                  {t.nav.signIn}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-white/8 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2">
            {nav.map((n) => (
              <NavLink key={n.href} href={n.href} label={n.label} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:py-12 lg:pb-12">{children}</main>

      <nav className="fixed bottom-3 left-1/2 z-50 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 grid-cols-4 gap-1 rounded-[1.5rem] border border-white/10 bg-[rgba(3,5,13,0.88)] p-1.5 shadow-glass backdrop-blur-2xl lg:hidden">
        {[
          { href: "/servers", label: t.mobileNav.worlds },
          { href: "/marketplace", label: t.mobileNav.market },
          { href: user ? "/profile" : "/auth/login", label: t.mobileNav.me },
          {
            href: isCreator ? "/studio" : user ? "/studio" : "/auth/login",
            label: isCreator ? t.mobileNav.studio : user ? t.mobileNav.becomeCreator : t.mobileNav.studio,
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-2 py-2 text-center text-[11px] font-medium text-fg-muted transition hover:bg-white/10 hover:text-fg"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgb(var(--primary))]" />
              {t.footer.tagline}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
              <Link href="/about" className="hover:text-fg">
                {t.footer.about}
              </Link>
              <Link href="/contact" className="hover:text-fg">
                {t.footer.contact}
              </Link>
              <Link href="/help" className="hover:text-fg">
                {t.footer.help}
              </Link>
              <Link href="/legal/privacy" className="hover:text-fg">
                {t.footer.privacy}
              </Link>
              <Link href="/legal/terms" className="hover:text-fg">
                {t.footer.terms}
              </Link>
              <Link href="/guides" className="hover:text-fg">
                {t.nav.guides}
              </Link>
              <Link href="/promocodes" className="hover:text-fg">
                {t.nav.promocodes}
              </Link>
              <Link href="/contests" className="hover:text-fg">
                {t.nav.contests}
              </Link>
              <Link href="/docs" className="hover:text-fg">
                {t.nav.docs}
              </Link>
              <Link href="/marketplace" className="hover:text-fg">
                {t.nav.marketplace}
              </Link>
              <Link href="/games" className="hover:text-fg">
                {t.nav.games}
              </Link>
              {!user ? (
                <>
                  <button type="button" className="hover:text-fg" onClick={() => startOAuth("google")}>
                    {t.auth.oauthGoogle}
                  </button>
                  <button type="button" className="hover:text-fg" onClick={() => startOAuth("steam")}>
                    {t.auth.oauthSteam}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
