import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { client } from "@/lib/sanity.client";
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// ===== 型（Step1に合わせて slug は文字列に統一） =====
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type AuthorRef = { _id: string; name?: string; slug?: string; picture?: SanityImage };
type CategoryRef = { _id: string; title: string; slug: string };

type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: unknown; // 型ガードで判定
  publishedAt?: string;
  excerpt?: string;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

type CategoryPageData = {
  category?: { _id: string; title: string; description?: string; slug: string };
  posts?: PostSummary[];
} | null;

type Params = { slug: string };

// ---- 画像の asset._ref があるかを確認する型ガード ----
function hasAssetRef(img: unknown): img is SanityImage {
  if (!img || typeof img !== "object") return false;
  const rec = img as Record<string, unknown>;
  const asset = rec["asset"] as Record<string, unknown> | undefined;
  return typeof asset?._ref === "string";
}

// ---- 日付フォーマット ----
function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

// 静的生成
export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(ALL_CATEGORY_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

// SEO
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) return { title: "Category not found" };
  const cat = data.category;
  return {
    title: `${cat.title} – Category`,
    description: cat.description || `${cat.title} に属する記事一覧`,
    openGraph: {
      title: `${cat.title} – Category`,
      description: cat.description || `${cat.title} に属する記事一覧`,
      url: `https://your-site.com/category/${cat.slug}`,
      type: "website",
    },
  };
}

// ===== ページ本体 =====
const PER_PAGE = 8;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: { page?: string };
}) {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) notFound();

  const { category, posts = [] } = data!;
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const total = posts.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageItems = posts.slice(start, start + PER_PAGE);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* パンくず */}
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900">ホーム</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-700">{category!.title}</span>
      </nav>

      {/* 見出し＆説明 */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-neutral-50 to-white p-6 ring-1 ring-neutral-100">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{category!.title}</h1>
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            {total} 件
          </span>
        </div>
        {category?.description ? (
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">{category.description}</p>
        ) : null}
      </section>

      {/* 投稿なし */}
      {!pageItems.length && (
        <p className="text-neutral-600">このカテゴリーにはまだ記事がありません。</p>
      )}

      {/* グリッド */}
      {pageItems.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((post) => (
            <li
              key={post._id}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={`/${post.slug}`} className="block">
                {/* サムネイル */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {hasAssetRef(post.mainImage) ? (
                    <Image
                      src={urlFor(post.mainImage).width(900).height(560).url()}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-100 text-neutral-400">No Image</div>
                  )}

                  {/* カテゴリーバッジ（最大2件） */}
                  {post.categories?.slice(0, 2).map((c) => (
                    <span
                      key={c._id}
                      className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-700 shadow ring-1 ring-black/5"
                    >
                      {c.title}
                    </span>
                  ))}
                </div>

                {/* 本文部 */}
                <div className="p-4">
                  <h2 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900">
                    {post.title}
                  </h2>

                  <div className="mt-1 text-xs text-neutral-500">
                    {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : null}
                  </div>

                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{post.excerpt}</p>
                  ) : null}

               {/* カテゴリーリンク（任意） */}
{post.categories?.length ? (
  <div className="mt-3 flex flex-wrap gap-2">
    {post.categories.map((c) => (
      <Link
        key={c._id}
        href={`/category/${c.slug}`}
        className="text-[11px] rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
      >
        {c.title}
      </Link>
    ))}
  </div>
) : null}

                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
          {/* Prev */}
          <Link
            href={page > 1 ? `/category/${category!.slug}?page=${page - 1}` : "#"}
            aria-disabled={page <= 1}
            className={`rounded-full border px-3 py-1.5 ${page <= 1 ? "pointer-events-none border-neutral-200 text-neutral-300" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"}`}
          >
            ← 前へ
          </Link>

          {/* Page indicators */}
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-700">
            {page} / {totalPages}
          </span>

          {/* Next */}
          <Link
            href={page < totalPages ? `/category/${category!.slug}?page=${page + 1}` : "#"}
            aria-disabled={page >= totalPages}
            className={`rounded-full border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none border-neutral-200 text-neutral-300" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"}`}
          >
            次へ →
          </Link>
        </nav>
      )}
    </main>
  );
}
