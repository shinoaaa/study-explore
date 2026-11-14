import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curiora — Where Curiosity Finds Its Way",
  description:
    "Explore interconnected concepts from your study materials or personal curiosity — where curiosity finds its way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F3F6FC] text-[#17233C] dark:bg-[#0B1120] dark:text-[#F1F5F9] antialiased selection:bg-[#2F80ED]/20 selection:text-[#17233C] dark:selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
