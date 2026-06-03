"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.about.badge} title={t.about.title} titleAccent={t.about.titleAccent} subtitle={t.about.subtitle} />
      <section className="holo-panel rounded-[2rem] p-8">
        <Badge tone="info">{t.about.mission}</Badge>
        <p className="mt-4 text-fg-muted">{t.about.missionDesc}</p>
      </section>
      <section className="holo-panel rounded-[2rem] p-8">
        <h2 className="text-2xl font-semibold">{t.about.diffTitle}</h2>
        <ul className="mt-4 space-y-3 text-fg-muted">
          <li>· {t.about.diff1}</li>
          <li>· {t.about.diff2}</li>
          <li>· {t.about.diff3}</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/servers">
            <Button>{t.home.exploreWorlds}</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline">{t.home.openMarket}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
