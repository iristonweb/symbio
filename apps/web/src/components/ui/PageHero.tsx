"use client";

import { Badge } from "@/components/ui/Badge";

export function PageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  children,
}: {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="holo-panel rounded-[2.5rem] p-8 sm:p-10">
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
    </section>
  );
}
