"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type PageHeroVariant =
  | "ecosystem"
  | "games"
  | "servers"
  | "marketplace"
  | "projects"
  | "news"
  | "guides"
  | "contests"
  | "billing"
  | "studio"
  | "profile"
  | "admin"
  | "docs";

const routeVariants: Record<string, PageHeroVariant> = {
  admin: "admin",
  billing: "billing",
  contests: "contests",
  docs: "docs",
  games: "games",
  guides: "guides",
  help: "docs",
  legal: "docs",
  marketplace: "marketplace",
  news: "news",
  profile: "profile",
  projects: "projects",
  promocodes: "contests",
  servers: "servers",
  studio: "studio",
};

function inferVariant(pathname: string): PageHeroVariant {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return routeVariants[segment] ?? "ecosystem";
}

export function PageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  children,
  variant,
}: {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: PageHeroVariant;
}) {
  const pathname = usePathname();
  const resolvedVariant = variant ?? inferVariant(pathname);

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-8 shadow-glass sm:p-10">
      <div className={cn("absolute inset-0 page-hero-banner", `page-hero-${resolvedVariant}`)} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.94),rgba(3,5,13,0.58),rgba(3,5,13,0.9))]" />
      <div className="absolute inset-0 ecosystem-grid opacity-25" />
      <div className="relative max-w-3xl">
        {badge ? <Badge tone="info">{badge}</Badge> : null}
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
          {titleAccent ? (
            <>
              {" "}
              <span className="text-gradient">{titleAccent}</span>
            </>
          ) : null}
        </h1>
        {subtitle ? <p className="mt-4 max-w-2xl text-fg-muted">{subtitle}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
