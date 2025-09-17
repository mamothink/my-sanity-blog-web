// src/components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/60 bg-gradient-to-b from-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-lg font-semibold tracking-tight text-neutral-900">IKEHAYA BLOG</p>
            <p className="max-w-sm text-sm text-neutral-600">
              Web3・投資・ライフスタイルの最新情報を届けるイケハヤの公式ブログ。個人が軽やかに生きるためのヒントを日々更新しています。
            </p>
          </div>
          <div className="grid flex-1 gap-6 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">コンテンツ</h4>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>
                  <Link href="/" className="transition-colors hover:text-indigo-600">
                    ブログトップ
                  </Link>
                </li>
                <li>
                  <Link href="/#categories" className="transition-colors hover:text-indigo-600">
                    カテゴリー一覧
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="transition-colors hover:text-indigo-600">
                    プロフィール
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">コミュニティ</h4>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>
                  <Link href="/#cta" className="transition-colors hover:text-indigo-600">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <a
                    href="https://twitter.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-indigo-600"
                  >
                    X(Twitter)
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-indigo-600"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">ニュースレター</h4>
              <p className="mt-3 text-sm text-neutral-600">
                週1回のメールで最新記事と限定ノウハウをお届けします。
              </p>
              <Link
                href="/#cta"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                登録の相談をする
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/60 pt-6 text-xs text-neutral-500">© {year} IKEHAYA BLOG</div>
      </div>
    </footer>
  );
}
