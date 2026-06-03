"use client";

import * as React from "react";
import { Badge, Button, GlowCard } from "@/components/primitives";

export default function StudioPage() {
  const [title, setTitle] = React.useState("");
  const [version, setVersion] = React.useState("1.0.0");
  const [license, setLicense] = React.useState("Standard");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge><span className="text-gradient font-semibold tracking-[0.12em]">CREATOR STUDIO</span><span className="ml-2">• MVP UI</span></Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Publish a release</h1>
          <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--cy-muted))]">
            Upload flow is mocked for Sprint 0: UI only. Next: signed uploads to MinIO + versioning + licenses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/marketplace")}>Marketplace</Button>
          <Button onClick={() => (window.location.href = "/admin/audit")}>Audit</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-12">
        <GlowCard className="md:col-span-7 p-6">
          <div className="text-xs text-[rgb(var(--cy-muted))]">Release details</div>
          <div className="mt-1 text-lg font-semibold">Metadata</div>

          <div className="mt-4 grid gap-3">
            <label className="text-sm">
              <div className="mb-1 text-xs text-[rgb(var(--cy-muted))]">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tactical HUD v2"
                className="h-11 w-full rounded-2xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] placeholder:text-[rgb(var(--cy-muted))] focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1 text-xs text-[rgb(var(--cy-muted))]">Version</div>
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="h-11 w-full rounded-2xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs text-[rgb(var(--cy-muted))]">License</div>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="h-11 w-full rounded-2xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]"
                >
                  {["Standard", "Commercial", "CC BY", "CC BY-NC"].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[rgb(var(--cy-muted))]">
              Upload is disabled in Sprint 0. Next: signed URL upload to MinIO + checksum + malware scan hooks.
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button disabled={!title}>Create draft</Button>
            <Button variant="outline">Save</Button>
          </div>
        </GlowCard>

        <GlowCard className="md:col-span-5 p-6">
          <div className="text-xs text-[rgb(var(--cy-muted))]">Checklist</div>
          <div className="mt-1 text-lg font-semibold">Before publish</div>

          <ul className="mt-4 space-y-2 text-sm text-[rgb(var(--cy-muted))] list-disc pl-5">
            <li>Pick game + compatibility constraints</li>
            <li>Add screenshots + changelog</li>
            <li>Choose license & pricing</li>
            <li>Run automated quality checks</li>
            <li>Optional: submit for verification</li>
          </ul>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[rgb(var(--cy-muted))]">
            Verified creators get better ranking and fewer friction checks.
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
