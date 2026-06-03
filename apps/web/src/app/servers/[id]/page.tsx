import Link from "next/link";
import { notFound } from "next/navigation";
import { accentClass, ecosystemServers, seasonEvents } from "@/lib/ecosystem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCapsule, PulseOrb } from "@/components/immersive/OrganismPanel";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return ecosystemServers.map((server) => ({ id: server.id }));
}

export default function ServerProfilePage({ params }: { params: { id: string } }) {
  const server = ecosystemServers.find((item) => item.id === params.id);
  if (!server) notFound();

  const population = Math.round((server.online / server.maxPlayers) * 100);

  return (
    <div className="space-y-10 pb-14">
      <section className="banner-server relative min-h-[520px] overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.94),rgba(3,5,13,0.45),rgba(3,5,13,0.86))]" />
        <div className="absolute inset-0 ecosystem-grid opacity-45" />
        <div className="relative grid h-full gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{server.mood}</Badge>
              <Badge tone="info">{server.game}</Badge>
              <Badge tone="neutral">{server.region}</Badge>
            </div>
            <h1 className="mt-6 max-w-3xl text-6xl font-semibold leading-none tracking-tight sm:text-8xl">
              {server.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-fg-muted">{server.lore}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Vote and join</Button>
              <Link href="/profile">
                <Button variant="outline">Save to profile</Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button variant="secondary">Owner analytics</Button>
              </Link>
            </div>
          </div>
          <div className="organism-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-fg-muted">organism pulse</div>
                <div className="mt-2 text-2xl font-semibold">{server.pulse}% live</div>
              </div>
              <PulseOrb value={server.pulse} accent={server.accent} size="lg" />
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8">
              <div className={cn("h-full rounded-full bg-gradient-to-r", accentClass(server.accent))} style={{ width: `${population}%` }} />
            </div>
            <div className="mt-2 text-xs text-fg-muted">
              {server.online}/{server.maxPlayers} players connected
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCapsule label="stability" value={`${server.stability}%`} hint="crash-free sessions" />
        <MetricCapsule label="faction power" value={server.faction} hint="dominant organism" />
        <MetricCapsule label="wipe countdown" value={server.wipeIn} hint={server.season} />
        <MetricCapsule label="community energy" value={`${server.energy}%`} hint="votes + chat + joins" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">lore and media</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">World identity</h2>
          <p className="mt-4 text-sm leading-7 text-fg-muted">
            {server.name} is presented as a living profile: lore, faction state, season mechanics,
            events and conversion-focused calls to join. Rich media slots are ready for screenshots,
            trailers and community snapshots.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {server.playstyle.map((tag) => (
              <div key={tag} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
                {tag}
              </div>
            ))}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">event sequence</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Season timeline</h2>
          <div className="mt-6 space-y-5">
            {seasonEvents.map((event) => (
              <div key={event.label}>
                <div className="flex justify-between text-sm">
                  <span>{event.label}</span>
                  <span className="text-fg-muted">{event.time}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/8">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", accentClass(server.accent))} style={{ width: `${event.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          ["Conversion", "+18.4%", "from profile to join"],
          ["Vote velocity", "642", "last 24 hours"],
          ["Retention", "71%", "7-day returning players"],
        ].map(([label, value, hint]) => (
          <div key={label} className="organism-panel rounded-[2rem] p-6">
            <div className="text-[10px] uppercase tracking-[0.24em] text-fg-muted">{label}</div>
            <div className="mt-3 text-4xl font-semibold text-gradient">{value}</div>
            <div className="mt-2 text-sm text-fg-muted">{hint}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
