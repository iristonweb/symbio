import { Suspense } from "react";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-fg-muted">Загрузка…</div>}>{children}</Suspense>;
}
