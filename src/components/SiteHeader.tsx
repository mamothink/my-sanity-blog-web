// src/components/SiteHeader.tsx
import Link from "next/link";
import { client } from "@/lib/sanity.client";

// このコンポーネントは Server Component（デフォルト）なので fetch が使えます
type Category = { _id: string; title: string; slug: string };

const CATEGORIES_NAV_QUERY = `
*[_type == "category" && defined(slug.current)]
| order(title asc){
  _id,
  title,
  "slug": slug.current
}
`;

export default async function SiteHeader() {
  let categories: Category[] = [];

  try {
    categories = await client.fetch<Category[]>(CATEGORIES_NAV_QUERY);
  } catch (error) {
    console.error("[SiteHeader] Failed to load categories", error);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* ロゴ */}
        <Link href="/" className="text-xl font-black tracking-tight text-neutral-900 sm:text-2xl">
          IKEHAYA
        </Link>

        {/* ナビ（デスクトップ） */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
              {c.title}
            </Link>
          ))}
        </nav>

        {/* モバイルナビ */}
        <div className="flex flex-1 justify-end md:hidden">
          <div className="flex max-w-[75vw] gap-2 overflow-x-auto rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
