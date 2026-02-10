import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import AppShell from "@/components/layout/(booth)/AppShell";
import "@/app/globals.css";

const notoSans = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "SITCON 大地遊戲",
  description: "SITCON 2026 OMO Rhythm Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoSans.variable} ${notoSerif.variable} bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
