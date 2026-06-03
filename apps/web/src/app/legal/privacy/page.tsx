"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";

export default function PrivacyPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8 pb-14">
      <PageHero title={t.legal.privacyTitle} subtitle={t.legal.updated} />
      <section className="holo-panel max-w-3xl rounded-[2rem] p-8">
        <p className="leading-relaxed text-fg-muted">{t.legal.privacyDesc}</p>
        <Badge tone="neutral" className="mt-6">
          {t.legal.updated}
        </Badge>
      </section>
    </div>
  );
}
