"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/components/cn";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import { UiModeProvider, useUiMode } from "@/components/UiMode";
import { Button, Chip, IconButton, Kbd } from "@/components/primitives";
import { ModeToggle } from "@/components/mode-toggle";
import { StatusPill } from "@/components/StatusPill";
import { CommandPalette, CommandItem } from "@/components/CommandPalette";
import {
  IconBolt,
  IconCmd,
  IconGrid,
  IconSearch,
  IconServer,
  IconShield,
  IconTable,
  IconUser,
} from "@/components/icons";

function Brand() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 rounded-2xl px-2 py-1 transition hover:bg-black/[0.04] dark:hover:bg-white/5"
    >
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-black/[0.04] ring-1 ring-black/10 dark:bg-white/6 dark:ring-white/12">
        <span className="text-lg text-black dark:text-white">
          <IconBolt />
        </span>
      </span>
      <span className="hidden sm:block">
        <span className="block text-sm font-semibold leading-none text-black dark:text-white">
          SYMBIO
        </span>
        <span className="block text-[11px] leading-none text-black/50 dark:text-white/50">
          UGC • Marketplace • Servers
        </span>
      </span>
    </Link>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-black/[0.06] text-black ring-1 ring-black/12 dark:bg-white/10 dark:text-white dark:ring-white/15"
          : "text-black/70 hover:bg-black/[0.05] hover:text-black dark:text-white/70 dark:hover:bg-white/6 dark:hover:text-white"
      )}
    >
      <span className="text-base opacity-90">{icon}</span>
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
}

function UiModeToggle() {
  const { mode, toggle } = useUiMode();
  return (
    <button
      onClick={toggle}
      className="group inline-flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 py-2 text-sm text-black/80 ring-1 ring-black/10 transition hover:bg-black/[0.07] dark:bg-white/5 dark:text-white/80 dark:ring-white/12 dark:hover:bg-white/10"
      title="Toggle UI mode"
    >
      <span className="text-base">{mode === "discover" ? <IconGrid /> : <IconTable />}</span>
      <span className="hidden lg:inline">{mode === "discover" ? "Discover" : "Expert"}</span>
    </button>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { mode, toggle } = useUiMode();

  const [open, setOpen] = React.useState(false);

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: CommandItem[] = React.useMemo(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        id: "home",
        title: "Discover",
        description: "Dashboard + launchpad",
        group: "Navigation",
        href: "/",
        icon: <IconGrid />,
        keywords: ["home", "dashboard"],
      },
      {
        id: "servers",
        title: "Servers",
        description: "Top Online + trending signals",
        group: "Navigation",
        href: "/servers",
        icon: <IconServer />,
        keywords: ["server", "list", "top online"],
      },
      {
        id: "audit",
        title: "Admin: Audit",
        description: "Events and moderation trail",
        group: "Navigation",
        href: "/admin/audit",
        icon: <IconShield />,
        keywords: ["admin", "logs", "events"],
      },
      {
        id: "toggleUIMode",
        title: `Switch to ${mode === "discover" ? "Expert" : "Discover"} mode`,
        description: "Compact view for power users",
        group: "Actions",
        action: () => toggle(),
        icon: mode === "discover" ? <IconTable /> : <IconGrid />,
        shortcut: "Shift+M",
        keywords: ["mode", "expert", "discover"],
      },
      {
        id: "toggleTheme",
        title: `Switch to ${currentTheme === "dark" ? "Light" : "Dark"} theme`,
        description: "Aurora dark ↔ white-tech",
        group: "Actions",
        action: () => setTheme(currentTheme === "dark" ? "light" : "dark"),
        icon: <IconCmd />,
        shortcut: "Shift+T",
        keywords: ["theme", "dark", "light"],
      },
      {
        id: "openDocs",
        title: "Open API docs",
        description: "Swagger UI",
        group: "Actions",
        action: () =>
          window.open(`${api.replace(/\/$/, "")}/docs`, "_blank", "noopener,noreferrer"),
        icon: <IconUser />,
        keywords: ["openapi", "docs", "swagger"],
      },
      {
        id: "reload",
        title: "Reload current page",
        description: "Hard refresh data",
        group: "Actions",
        action: () => router.refresh(),
        icon: <IconBolt />,
        shortcut: "Shift+R",
        keywords: ["refresh", "reload"],
      },
    ];
  }, [mode, toggle, currentTheme, setTheme, router]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "m") {
        e.preventDefault();
        toggle();
      }
      if (k === "t") {
        e.preventDefault();
        setTheme(currentTheme === "dark" ? "light" : "dark");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, setTheme, currentTheme]);

  return (
    <>
      <SpotlightBackground />
      <CommandPalette open={open} setOpen={setOpen} commands={commands} />

      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-3 sm:px-5">
          <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl bg-black/[0.03] px-2 py-2 ring-1 ring-black/10 backdrop-blur-xl dark:bg-white/[0.06] dark:ring-white/12">
            <div className="flex items-center gap-2">
              <Brand />
              <div className="hidden lg:flex items-center gap-2 pl-1">
                <NavLink href="/" icon={<IconGrid />}>
                  Discover
                </NavLink>
                <NavLink href="/marketplace" icon={<IconStore />}>
                  Marketplace
                </NavLink>
                <NavLink href="/servers" icon={<IconServer />}>
                  Servers
                </NavLink>
                <NavLink href="/studio" icon={<IconSpark />}>
                  Studio
                </NavLink>
                <NavLink href="/docs" icon={<IconFile />}>
                  Docs
                </NavLink>
                <NavLink href="/admin/audit" icon={<IconShield />}>
                  Audit
                </NavLink>
                <span className="pl-1">
                  <Chip className="hidden xl:inline-flex">
                    <span className="opacity-70">Sprint</span> 0
                  </Chip>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill className="hidden md:inline-flex" />

              <UiModeToggle />

              <Button
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => setOpen(true)}
              >
                <span className="text-base">
                  <IconSearch />
                </span>
                Search
                <span className="ml-1 hidden md:inline-flex items-center gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </Button>

              <IconButton
                className="sm:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open command palette"
                title="Open command palette (Ctrl+K)"
              >
                <IconSearch />
              </IconButton>

              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-16 pt-6 sm:px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto max-w-6xl px-3 pb-10 sm:px-5">
        <div className="flex flex-col gap-3 rounded-3xl bg-black/[0.03] p-5 ring-1 ring-black/10 md:flex-row md:items-center md:justify-between dark:bg-white/[0.04] dark:ring-white/10">
          <div className="text-sm text-black/60 dark:text-white/60">
            <span className="text-black/85 dark:text-white/85">SYMBIO</span> — cyber UI prototype (Discover/Expert).
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 dark:text-white/55">
            <Chip>Ctrl+K</Chip>
            <Chip>Shift+M</Chip>
            <Chip>Shift+T</Chip>
            <Chip>API: /health</Chip>
          </div>
        </div>
      </footer>
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <UiModeProvider>
        <ShellInner>{children}</ShellInner>
      </UiModeProvider>
    </ThemeProvider>
  );
}
