import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Shell } from "@/components/Shell";
import { UiModeProvider } from "@/components/UiModeProvider";

export const metadata: Metadata = {
  title: "SYMBIO — Living Gaming Ecosystem",
  description:
    "Premium immersive gaming ecosystem for living server worlds, player recommendations and owner analytics.",
  icons: {
    icon: "/symbio-logo.png",
    shortcut: "/symbio-logo.png",
    apple: "/symbio-logo.png",
  },
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
