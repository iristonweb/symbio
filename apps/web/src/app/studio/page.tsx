"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function StudioPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = React.useState<"project" | "server">("project");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [projectName, setProjectName] = React.useState("");
  const [projectDesc, setProjectDesc] = React.useState("");
  const [gameSlugs, setGameSlugs] = React.useState("dayz");

  const [serverName, setServerName] = React.useState("");
  const [serverGame, setServerGame] = React.useState("dayz");
  const [host, setHost] = React.useState("127.0.0.1");
  const [port, setPort] = React.useState("27015");

  const submitProject = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchApi<{ slug: string }>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          game_slugs: gameSlugs.split(",").map((s) => s.trim()),
          links: {},
        }),
      });
      setMsg(`${t.studio.created}: ${r.slug}`);
      router.push(`/projects/${r.slug}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    } finally {
      setLoading(false);
    }
  };

  const submitServer = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchApi<{ id: string }>("/servers", {
        method: "POST",
        body: JSON.stringify({
          game: serverGame,
          name: serverName,
          host,
          port: parseInt(port, 10),
          tags: {},
        }),
      });
      setMsg(t.studio.created);
      router.push(`/servers/${r.id}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-14">
      <section className="holo-panel rounded-[2.7rem] p-8">
        <Badge tone="info">{t.studio.badge}</Badge>
        <h1 className="mt-4 text-5xl font-semibold">
          {t.studio.title} <span className="text-gradient">{t.studio.titleAccent}</span>
        </h1>
        <p className="mt-4 text-fg-muted">{t.studio.subtitle}</p>
      </section>

      <div className="flex gap-2">
        {(["project", "server"] as const).map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={
              tab === tb
                ? "rounded-full border border-primary/50 bg-primary/15 px-4 py-2 text-xs text-primary"
                : "rounded-full border border-white/10 px-4 py-2 text-xs text-fg-muted"
            }
          >
            {tb === "project" ? t.studio.project : t.studio.server}
          </button>
        ))}
        <Link href="/billing" className="ml-auto text-sm text-primary hover:underline">
          {t.studio.billingLink}
        </Link>
      </div>

      {msg ? <p className="text-sm text-primary">{msg}</p> : null}

      {tab === "project" ? (
        <div className="holo-panel max-w-xl space-y-4 rounded-[2rem] p-6">
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={t.studio.projectName} />
          <Input value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder={t.studio.description} />
          <Input value={gameSlugs} onChange={(e) => setGameSlugs(e.target.value)} placeholder={t.studio.gamesList} />
          <Button disabled={loading || !projectName} onClick={submitProject}>
            {t.studio.createProject}
          </Button>
        </div>
      ) : (
        <div className="holo-panel max-w-xl space-y-4 rounded-[2rem] p-6">
          <Input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder={t.studio.serverName} />
          <Input value={serverGame} onChange={(e) => setServerGame(e.target.value)} placeholder={t.studio.gameSlug} />
          <div className="grid grid-cols-2 gap-4">
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder={t.studio.host} />
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder={t.studio.port} />
          </div>
          <Button disabled={loading || !serverName} onClick={submitServer}>
            {t.studio.addServer}
          </Button>
        </div>
      )}
    </div>
  );
}
