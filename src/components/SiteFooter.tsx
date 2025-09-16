// src/components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-600">© {year} My Blog</p>
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            <li>
              <Link href="/" className="text-neutral-700 hover:underline">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-neutral-700 hover:underline">
                このサイトについて
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-neutral-700 hover:underline">
                お問い合わせ
              </Link>
            </li>
            <li>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-700 hover:underline"
              >
                X(Twitter)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
