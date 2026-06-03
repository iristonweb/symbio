"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] " +
          "placeholder:text-[color:var(--muted)] outline-none " +
          "focus:ring-2 focus:ring-[rgba(0,245,212,0.35)] focus:border-[rgba(0,245,212,0.6)]",
        className
      )}
      {...props}
    />
  );
}
