"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="font-display text-5xl font-semibold">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">{t.notFound.title}</h2>
      <p className="mt-3 text-fg-muted">{t.notFound.desc}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button>{t.notFound.home}</Button>
        </Link>
        <Link href="/servers">
          <Button variant="outline">{t.notFound.servers}</Button>
        </Link>
        <Link href="/marketplace">
          <Button variant="secondary">{t.notFound.market}</Button>
        </Link>
      </div>
    </div>
  );
}
