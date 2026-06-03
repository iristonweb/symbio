"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ToastProps = {
  message: string | null;
  tone?: "info" | "success" | "error";
  onClose?: () => void;
};

export function Toast({ message, tone = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    if (!message || !onClose) return;
    const id = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 right-5 z-[90] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-glass backdrop-blur-xl lg:bottom-5",
        tone === "success" && "border-accent/30 bg-black/85 text-accent",
        tone === "error" && "border-red-400/35 bg-black/85 text-red-200",
        tone === "info" && "border-primary/30 bg-black/85 text-fg"
      )}
    >
      {message}
    </div>
  );
}
