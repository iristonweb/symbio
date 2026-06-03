"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const CHECKLIST = [
  "Semantic versioning",
  "License metadata",
  "Compatibility matrix",
  "Signed upload URLs",
  "Malware scan hooks",
];

export default function StudioPage() {
  const [title, setTitle] = React.useState("");
  const [version, setVersion] = React.useState("1.0.0");
  const [license, setLicense] = React.useState("Standard");

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="info">
          <span className="text-gradient font-semibold tracking-[0.12em]">CREATOR STUDIO</span>
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Publish a <span className="text-gradient">release</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Upload flow mocked for Sprint 0. Next: MinIO signed URLs + versioning.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              Marketplace
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button size="sm">Audit</Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlowCard className="lg:col-span-7 p-6">
          <div className="text-xs text-fg-muted">Release details</div>
          <div className="mt-1 text-lg font-semibold">Metadata</div>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-xs text-fg-muted">Title</label>
              <div className="mt-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tactical HUD v2"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-fg-muted">Version</label>
                <div className="mt-2">
                  <Input value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-fg-muted">License</label>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-fg outline-none focus:border-primary/40"
                >
                  {["Standard", "Commercial", "CC BY", "CC BY-NC"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-fg-muted">
              Upload disabled in Sprint 0. Next: signed URL to MinIO + checksum validation.
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button disabled={!title}>Create draft</Button>
            <Button variant="outline">Save</Button>
          </div>
        </GlowCard>

        <GlowCard className="lg:col-span-5 p-6">
          <div className="text-xs text-fg-muted">Checklist</div>
          <div className="mt-1 text-lg font-semibold">Before publish</div>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="h-2 w-2 rounded-full bg-primary/80" />
                {item}
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>
    </div>
  );
}
