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
    neutral: "bg-white/8 text-fg border-white/12",
    success: "bg-accent/15 text-accent border-accent/35",
    warning: "bg-gold/15 text-gold border-gold/35",
    danger: "bg-[rgba(255,80,110,0.12)] text-[rgba(255,140,160,0.95)] border-[rgba(255,80,110,0.35)]",
    info: "bg-primary/15 text-primary border-primary/35",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
