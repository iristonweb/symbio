"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/platform-api";
import { Button } from "@/components/ui/Button";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = React.useState<"pending" | "ok" | "error">("pending");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    fetchApi<{ status: string }>(`/auth/verify-email/confirm?token=${encodeURIComponent(token)}`, {
      method: "POST",
    })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mx-auto max-w-lg holo-panel rounded-[2rem] p-8 text-center">
      {status === "pending" ? <p className="text-fg-muted">Подтверждаем email…</p> : null}
      {status === "ok" ? (
        <>
          <h1 className="text-2xl font-semibold text-gradient">Email подтверждён</h1>
          <Link href="/profile" className="mt-6 inline-block">
            <Button>Перейти в профиль</Button>
          </Link>
        </>
      ) : null}
      {status === "error" ? (
        <>
          <h1 className="text-2xl font-semibold">Ссылка недействительна</h1>
          <p className="mt-2 text-sm text-fg-muted">Запросите новое письмо в профиле.</p>
          <Link href="/profile" className="mt-6 inline-block">
            <Button variant="secondary">Профиль</Button>
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-fg-muted">…</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
