"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";

export default function ContactPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.contact.badge} title={t.contact.title} titleAccent={t.contact.titleAccent} subtitle={t.contact.subtitle} />
      <section className="holo-panel max-w-2xl rounded-[2rem] p-8">
        <p className="text-lg">
          <a href={`mailto:${t.contact.email}`} className="text-primary hover:text-fg">
            {t.contact.email}
          </a>
        </p>
        <p className="mt-4 text-fg-muted">{t.contact.telegram}</p>
        <p className="mt-4 text-sm text-fg-muted">{t.contact.response}</p>
        <Badge tone="neutral" className="mt-6">
          {t.contact.formNote}
        </Badge>
        <Link href="/help" className="mt-6 inline-block text-sm text-primary hover:text-fg">
          {t.help.title} →
        </Link>
      </section>
    </div>
  );
}
