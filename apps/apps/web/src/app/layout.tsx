import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "SYMBIO — Sprint 0",
  description: "Marketplace + Server Hub + Creator Studio + One‑Click Install Client",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="cy-bg min-h-screen bg-[rgb(var(--cy-bg))] text-[rgb(var(--cy-text))]">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
