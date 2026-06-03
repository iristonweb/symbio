"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.85)] px-4 text-sm text-fg outline-none",
          "placeholder:text-fg-muted autofill:shadow-[inset_0_0_0_1000px_rgb(8,12,22)] autofill:text-fg",
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
