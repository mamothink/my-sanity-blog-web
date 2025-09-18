import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

// ✅ 優先順: NEXT_PUBLIC_SITE_URL > VERCEL_URL > localhost
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "My Blog",
  description: "Sanity + Next.js blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-white text-neutral-900 antialiased">
        <SiteHeader />
        {/* 全ページで最大幅を統一しつつ、内側に余白を確保 */}
        <main className="mx-auto w-full max-w-[1200px] min-h-[60vh] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
