"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, type ApiProject } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    platformApi
      .project(slug)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-96" />;
  if (!project) return <p className="text-fg-muted">{t.projects.notFound}</p>;

  return (
    <div className="space-y-10 pb-14">
      <section className="holo-panel rounded-[2.5rem] p-8">
        <h1 className="text-5xl font-semibold">{project.name}</h1>
        <p className="mt-4 max-w-3xl text-fg-muted">{project.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Badge tone="success">
            {project.online_total}/{project.max_players_total} {t.common.players}
          </Badge>
          <Badge tone="info">
            {project.votes} {t.common.votes}
          </Badge>
        </div>
        {project.source_url ? (
          <p className="mt-4 text-xs text-fg-muted">
            {t.common.sourceMeta}: {project.source_url}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">{t.projects.serversInProject}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(project.servers ?? []).map((s) => (
            <Link key={s.id} href={`/servers/${s.id}`} className="organism-panel rounded-[2rem] p-5">
              <span className="font-semibold">{s.name}</span>
              <p className="mt-2 text-xs text-fg-muted">
                {s.snapshot?.online ?? 0}/{s.snapshot?.max_players ?? 0}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
