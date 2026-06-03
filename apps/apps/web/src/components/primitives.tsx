"use client";

import * as React from "react";
import { cn } from "@/components/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "solid", size = "md", ...props }: ButtonProps) {
  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
        ? "h-12 px-5 text-[15px]"
        : "h-10 px-4 text-sm";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition will-change-transform select-none " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    solid:
      "text-black bg-[linear-gradient(90deg,rgb(var(--cy-lime)_/_0.96),rgb(var(--cy-accent)_/_0.96))] " +
      "shadow-[0_14px_45px_rgb(var(--cy-lime)_/_0.18)] hover:shadow-[0_18px_70px_rgb(var(--cy-lime)_/_0.22)] " +
      "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
    ghost:
      "text-[rgb(var(--cy-text))] bg-white/0 hover:bg-white/6 border border-transparent " +
      "hover:-translate-y-0.5 active:translate-y-0",
    outline:
      "text-[rgb(var(--cy-text))] bg-white/0 border border-white/12 hover:bg-white/6 " +
      "hover:-translate-y-0.5 active:translate-y-0",
  };

  return <button className={cn(base, sizes, styles[variant], className)} {...props} />;
}

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[rgb(var(--cy-text))] transition hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[rgb(var(--cy-muted))]",
        className,
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-[rgb(var(--cy-muted))]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-[rgb(var(--cy-muted))]",
        className,
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl px-4 text-sm outline-none",
          "bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] placeholder:text-[rgb(var(--cy-muted))]",
          "focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export function SectionTitle({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="text-sm text-[rgb(var(--cy-muted))]">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/6", className)} />;
}

type GlowCardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

/**
 * Bento card with subtle “premium” glow. In Theme 4 it tracks the cursor.
 */
export function GlowCard({ className, interactive = true, children, ...props }: GlowCardProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    const y = Math.max(0, Math.min(r.height, e.clientY - r.top));
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border",
        "bg-[rgb(var(--cy-surface)_/_0.70)] border-[rgb(var(--cy-border))] backdrop-blur-xl",
        "transition will-change-transform",
        "hover:-translate-y-1 hover:shadow-[0_24px_110px_rgba(0,0,0,0.40)]",
        className,
      )}
      {...props}
    >
      {/* hover sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(var(--cy-lime) / 0.18), rgb(var(--cy-accent) / 0.12), transparent 70%)",
        }}
      />
      {/* micro grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url('/noise.png')] [background-size:320px_320px]" />

      <div className="relative">{children}</div>
    </div>
  );
}
