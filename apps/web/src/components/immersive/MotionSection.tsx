"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function MotionSection({
  children,
  className,
  stagger = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      custom={stagger}
      className={cn(className)}
    >
      {children}
    </motion.section>
  );
}

export function MotionItem({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={index} className={cn(className)}>
      {children}
    </motion.div>
  );
}

export { fadeUp };
