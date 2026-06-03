"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuthToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  React.useEffect(() => {
    const token = params.get("token");
    if (token) {
      setAuthToken(token).then(() => router.replace("/profile"));
      return;
    }
    const provider = params.get("provider");
    const dev = params.get("dev");
    const state = params.get("state");
    if (dev === "1" && provider) {
      window.location.href = `${apiUrl}/auth/${provider}/callback?dev=1&state=${state || ""}`;
      return;
    }
    router.replace("/auth/login");
  }, [params, router, setAuthToken, apiUrl]);

  return <p className="text-fg-muted">Подключение аккаунта…</p>;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-fg-muted">…</p>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
