import Link from "next/link";
import { ecosystemServers } from "@/lib/ecosystem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrganismPanel, MetricCapsule } from "@/components/immersive/OrganismPanel";

const traits = ["Hardcore survival", "Faction wars", "Night raids", "High wipe pressure"];

export default function ProfilePage() {
  return (
    <div className="space-y-10 pb-14">
      <section className="relative overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 ecosystem-backdrop opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.92),rgba(3,5,13,0.66),rgba(3,5,13,0.9))]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <Badge tone="info">player identity</Badge>
            <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
              Your playstyle has a <span className="text-gradient">signal.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-fg-muted">
              SYMBIO can recommend worlds by tension, wipe cadence, faction culture, stability and
              community energy instead of generic popularity.
            </p>
          </div>
          <div className="organism-panel rounded-[2rem] p-6">
            <div className="text-[10px] uppercase tracking-[0.24em] text-fg-muted">match profile</div>
            <div className="mt-3 text-5xl font-semibold text-gradient">88%</div>
            <div className="mt-2 text-sm text-fg-muted">best fit: Neon Frontier</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {traits.map((trait) => (
                <span key={trait} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fg-muted">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCapsule label="saved worlds" value="12" hint="tracked organisms" />
        <MetricCapsule label="vote streak" value="9d" hint="community trust" />
        <MetricCapsule label="recommendation fit" value="88%" hint="hardcore profile" />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <Badge tone="success">recommended worlds</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Matched to your current mood</h2>
          </div>
          <Link href="/servers" className="hidden text-sm text-primary sm:block">
            Tune filters →
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {ecosystemServers.slice(0, 2).map((server, index) => (
            <OrganismPanel key={server.id} server={server} index={index} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ["Community snapshot", "Your saved worlds are entering peak activity between 19:00 and 23:00."],
          ["Season alert", "Ember Colony wipe window is close. Expect high-risk PvP."],
          ["Faction signal", "Aurora Syndicate is gaining territory across your preferred servers."],
        ].map(([title, copy]) => (
          <div key={title} className="holo-panel rounded-[2rem] p-6">
            <Badge tone="info">{title}</Badge>
            <p className="mt-4 text-sm leading-7 text-fg-muted">{copy}</p>
          </div>
        ))}
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="warning">community CTA</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">Join the ecosystem layer.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted">
          Follow worlds, vote, receive wipe alerts, save profiles and let SYMBIO tune recommendations
          around your actual playstyle.
        </p>
        <Link href="/auth/register" className="mt-5 inline-block">
          <Button>Join community</Button>
        </Link>
      </section>
    </div>
  );
}
