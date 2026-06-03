"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";

export default function HelpPage() {
  const { t } = useLocale();

  const faq = [
    { q: t.help.q1, a: t.help.a1 },
    { q: t.help.q2, a: t.help.a2 },
    { q: t.help.q3, a: t.help.a3 },
  ];

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.help.badge} title={t.help.title} titleAccent={t.help.titleAccent} subtitle={t.help.subtitle} />
      <div className="grid gap-4">
        {faq.map((item) => (
          <div key={item.q} className="holo-panel rounded-[2rem] p-6">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-2 text-sm text-fg-muted">{item.a}</p>
          </div>
        ))}
      </div>
      <Link href="/docs" className="text-sm text-primary hover:text-fg">
        {t.help.devDocs} →
      </Link>
    </div>
  );
}
