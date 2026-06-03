import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Shell } from "@/components/Shell";
import { UiModeProvider } from "@/components/UiModeProvider";

export const metadata: Metadata = {
  title: "SYMBIO — UGC Marketplace & Server Hub",
  description:
    "Futuristic immersive platform: marketplace mods, server hub, creator studio with one-click install.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <UiModeProvider>
            <Shell>{children}</Shell>
          </UiModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
