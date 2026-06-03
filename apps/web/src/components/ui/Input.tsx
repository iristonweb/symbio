"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-fg outline-none",
          "placeholder:text-fg-muted",
          "focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
          "transition",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
