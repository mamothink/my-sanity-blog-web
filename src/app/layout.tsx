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
        {/* max-w を外し、全幅に変更 → ページ側で自由に制御 */}
        <main className="min-h-[60vh] px-0 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
