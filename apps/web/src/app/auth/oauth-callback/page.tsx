"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/Button";

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuthToken } = useAuth();
  const { t } = useLocale();
  const [error, setError] = React.useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  React.useEffect(() => {
    const err = params.get("error");
    if (err) {
      setError(err);
      return;
    }
    const token = params.get("token");
    if (token) {
      setAuthToken(token)
        .then(() => router.replace("/profile"))
        .catch(() => setError(t.auth.loginFailed));
      return;
    }
    const provider = params.get("provider");
    const dev = params.get("dev");
    const state = params.get("state");
    if (dev === "1" && provider) {
      window.location.href = `${apiUrl}/auth/${provider}/callback?dev=1&state=${state || ""}`;
      return;
    }
    setError(t.auth.loginFailed);
  }, [params, router, setAuthToken, apiUrl, t.auth.loginFailed]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-red-300">{error}</p>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button>{t.auth.signInLink}</Button>
        </Link>
      </div>
    );
  }

  return <p className="text-fg-muted">{t.common.loading}</p>;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-fg-muted">…</p>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
