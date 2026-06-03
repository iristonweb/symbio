import * as React from "react";
import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[color:var(--card2)] text-[color:var(--fg)] border-[color:var(--border)]",
    success:
      "bg-[rgba(180,255,57,0.14)] text-[color:var(--accent)] border-[rgba(180,255,57,0.35)]",
    warning:
      "bg-[rgba(255,190,70,0.12)] text-[rgba(255,190,70,0.95)] border-[rgba(255,190,70,0.35)]",
    danger:
      "bg-[rgba(255,80,110,0.12)] text-[rgba(255,80,110,0.95)] border-[rgba(255,80,110,0.35)]",
    info:
      "bg-[rgba(0,245,212,0.12)] text-[color:var(--primary)] border-[rgba(0,245,212,0.35)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
