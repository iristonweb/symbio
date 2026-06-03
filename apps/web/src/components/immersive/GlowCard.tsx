"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type GlowCardProps = {
  className?: string;
  interactive?: boolean;
  delay?: number;
  children?: React.ReactNode;
};

export function GlowCard({
  className,
  interactive = true,
  delay = 0,
  children,
}: GlowCardProps) {
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
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      onPointerMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10",
        "bg-surface/70 backdrop-blur-xl",
        "transition will-change-transform",
        "hover:-translate-y-1 hover:border-primary/25 hover:shadow-glow-lg",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--primary) / 0.16), rgb(var(--gold) / 0.08), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 noise-overlay" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
