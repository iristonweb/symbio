"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/Button";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading) {
    return <p className="text-fg-muted">{t.common.loading}</p>;
  }

  if (!user) return null;

  if (!hasRole(user, "admin")) {
    return (
      <div className="holo-panel mx-auto max-w-lg rounded-[2rem] p-8 text-center">
        <h1 className="text-2xl font-semibold">{t.guard.adminOnlyTitle}</h1>
        <p className="mt-3 text-sm text-fg-muted">{t.guard.adminOnlyDesc}</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>{t.guard.backHome}</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
