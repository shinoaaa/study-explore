import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trellis — Knowledge Exploration Platform",
  description:
    "AI-Powered Knowledge Exploration Platform yang memetakan materi pembelajaran dan minat personal menjadi Regional Skill Tree interaktif (LOGICODIX 2026).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F3F6FC] text-[#17233C] antialiased selection:bg-[#2F80ED]/20 selection:text-[#17233C]">
        {children}
      </body>
    </html>
  );
}
