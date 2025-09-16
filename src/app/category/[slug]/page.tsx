// src/app/category/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity.client";
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// 型
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type AuthorRef = { _id: string; name?: string; slug?: Slug; picture?: SanityImage };
type CategoryRef = { _id: string; title: string; slug: Slug };

type PostSummary = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: unknown;
  publishedAt?: string;
  excerpt?: string;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

type CategoryPageData = {
  category?: { _id: string; title: string; description?: string; slug: Slug };
  posts?: PostSummary[];
} | null;

type Params = { slug: string };

// ---- helpers ----
function toSlug(s?: Slug) {
  return typeof s === "string" ? s : s?.current ?? "";
}
function hasAssetRef(img: unknown): img is SanityImage {
  if (!img || typeof img !== "object") return false;
  const rec = img as Record<string, unknown>;
  const asset = rec["asset"] as Record<string, unknown> | undefined;
  return typeof asset?._ref === "string";
}
function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ja-JP");
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
  const catTitle = data.category.title || toSlug(data.category.slug);
  return {
    title: `${catTitle} – Category`,
    description: data.category.description || `${catTitle} に属する記事一覧`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) notFound();

  const { category, posts = [] } = data!;
  const catTitle = category!.title || toSlug(category!.slug);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 ring-1 ring-gray-100">
        <h1 className="text-2xl font-bold tracking-tight">{catTitle}</h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{posts.length} 件</p>
      </section>

      {!posts.length && <p>このカテゴリーにはまだ記事がありません。</p>}

      <ul className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => {
          const postSlug = toSlug(post.slug);
          return (
            <li
              key={post._id}
              className="group overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg"
            >
              <Link href={`/${postSlug}`} className="block overflow-hidden">
                {hasAssetRef(post.mainImage) ? (
                  <Image
                    src={urlFor(post.mainImage).width(1200).height(630).url()}
                    alt={post.title}
                    width={1200}
                    height={630}
                    className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">
                    No Image
                  </div>
                )}
              </Link>

              <div className="p-5">
                {/* カテゴリーバッジ */}
                {post.categories?.length ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.categories.map((c) => (
                      <Link
                        key={c._id}
                        href={`/category/${toSlug(c.slug)}`}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {/* タイトル */}
                <h2 className="text-lg font-semibold">
                  <Link href={`/${postSlug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                {/* 投稿日 */}
                <div className="mt-1 text-xs text-gray-500">
                  {post.publishedAt && formatDate(post.publishedAt)}
                </div>

                {/* 抜粋 */}
                {post.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm text-gray-700">{post.excerpt}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
