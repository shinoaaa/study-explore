import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trellis — Your Knowledge Cosmos",
  description:
    "Explore interconnected concepts from your study materials or personal curiosity inside an adaptive regional knowledge tree.",
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
