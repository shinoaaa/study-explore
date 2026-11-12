import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusVault AI — Knowledge Exploration Platform",
  description:
    "AI-Powered Knowledge Exploration Platform yang memetakan materi pembelajaran dan minat personal menjadi Regional Skill Tree interaktif (LOGICODIX 2026).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
