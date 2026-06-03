import Link from "next/link";
import { ecosystemServers } from "@/lib/ecosystem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCapsule, PulseOrb } from "@/components/immersive/OrganismPanel";

const funnel = [
  ["Profile views", "42.8K", "100%"],
  ["Join clicks", "9.4K", "21.9%"],
  ["Votes", "3.1K", "7.2%"],
  ["Returning players", "6.7K", "15.6%"],
];

const heat = [64, 82, 48, 91, 73, 56, 88, 39, 77, 95, 62, 84];

export default function AdminDashboardPage() {
  const lead = ecosystemServers[0];

  return (
    <div className="space-y-10 pb-14">
      <section className="banner-control relative overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.9),rgba(3,5,13,0.48),rgba(3,5,13,0.86))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">owner command</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            Grow a server like a <span className="text-gradient">living economy.</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">
            Monitor conversion, retention, vote velocity, activity heatmaps, community pressure and
            profile performance from one cinematic control room.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio">
              <Button>Add server</Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="outline">Audit log</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCapsule label="conversion" value="+18.4%" hint="profile to join" />
        <MetricCapsule label="retention" value="71%" hint="7-day return" />
        <MetricCapsule label="vote velocity" value="642" hint="last 24h" />
        <MetricCapsule label="activity" value="High" hint="community pressure" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="organism-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge tone="success">lead organism</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">{lead.name}</h2>
              <p className="mt-2 text-sm text-fg-muted">{lead.mood}</p>
            </div>
            <PulseOrb value={lead.pulse} accent={lead.accent} size="lg" />
          </div>
          <div className="mt-6 space-y-3">
            {funnel.map(([label, value, pct]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-fg-muted">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300" style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">activity heatmap</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Community energy by window</h2>
          <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {heat.map((value, index) => (
              <div key={`${value}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="h-20 overflow-hidden rounded-xl bg-white/8">
                  <div className="mt-auto h-full rounded-xl bg-gradient-to-t from-fuchsia-500 via-cyan-300 to-lime-300 opacity-85" style={{ transform: `translateY(${100 - value}%)` }} />
                </div>
                <div className="mt-2 text-center text-[10px] text-fg-muted">{value}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ["Recommended action", "Push wipe countdown CTA to the top of the profile."],
          ["Risk signal", "Stability below 80% can reduce returning player intent."],
          ["Growth window", "Faction surge is best promoted 12h before peak activity."],
        ].map(([title, copy]) => (
          <div key={title} className="holo-panel rounded-[2rem] p-6">
            <Badge tone="info">{title}</Badge>
            <p className="mt-4 text-sm leading-7 text-fg-muted">{copy}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
