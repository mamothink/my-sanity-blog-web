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
  const categories = await client.fetch<Category[]>(CATEGORIES_NAV_QUERY);

  return (
    <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* ロゴ */}
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
          My Blog
        </Link>

        {/* ナビ（横スクロール可） */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-3">
            {categories.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* モバイル（横スクロール） */}
        <nav className="md:hidden -mr-2">
          <div className="flex max-w-[70vw] gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
