// src/app/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { client } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// ===== 型 =====
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type CategoryRef = { _id: string; title: string; slug: Slug };
type AuthorRef = { _id: string; name?: string; slug?: Slug };

type Post = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: unknown; // 画像は unknown として受け取り、型ガードで判定
  publishedAt?: string;
  excerpt?: string;
  body?: unknown;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

// ---- Sanity 画像の asset._ref があるか判定する型ガード ----
function hasAssetRef(img: unknown): img is SanityImage {
  if (!img || typeof img !== "object") return false;
  const rec = img as Record<string, unknown>;
  const asset = rec["asset"] as Record<string, unknown> | undefined;
  return typeof asset?._ref === "string";
}

// ===== OGP / SEO =====
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: params.slug });
  if (!post) return { title: "記事が見つかりません" };

  const slug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";
  const ogImage = hasAssetRef(post.mainImage)
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "https://your-site.com/default-og.png";

  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} の記事詳細`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      url: `https://your-site.com/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "",
      images: [ogImage],
    },
  };
}

// ===== ページ本体 =====
export default async function PostPage({ params }: { params: Params }) {
  // 記事本体
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: params.slug });
  if (!post) return notFound();

  // 関連記事（同じカテゴリ、本人除外）
  const categoryIds =
    post.categories?.map((c) => c._id).filter((v): v is string => Boolean(v)) ?? [];
  const related: Post[] =
    categoryIds.length > 0
      ? await client.fetch<Post[]>(RELATED_POSTS_QUERY, {
          categoryIds,
          currentPostId: post._id,
        })
      : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article>
        {/* サムネイル（安全に判定） */}
        {hasAssetRef(post.mainImage) ? (
          <Image
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title}
            width={1200}
            height={630}
            className="mb-6 rounded-xl"
            priority
          />
        ) : null}

        {/* タイトル */}
        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

        {/* 日付と著者 */}
        <div className="mb-4 text-sm text-gray-500">
          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("ja-JP")}
          {post.author?.name && (
            <>
              {" "}
              · by{" "}
              <Link
                href={`/author/${
                  typeof post.author.slug === "string"
                    ? post.author.slug
                    : post.author.slug?.current ?? ""
                }`}
                className="hover:underline"
              >
                {post.author.name}
              </Link>
            </>
          )}
        </div>

        {/* 抜粋 */}
        {post.excerpt && <p className="mb-6">{post.excerpt}</p>}

        {/* カテゴリーリンク */}
        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((c) => {
              const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? "";
              return (
                <Link
                  key={c._id}
                  href={`/category/${cSlug}`}
                  className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  {c.title}
                </Link>
              );
            })}
          </div>
        ) : null}
      </article>

      {/* === 関連記事 === */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">関連記事</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.map((r) => {
              const rSlug = typeof r.slug === "string" ? r.slug : r.slug?.current ?? "";
              return (
                <li key={r._id} className="rounded-lg border p-4 hover:shadow-sm transition">
                  <Link href={`/${rSlug}`} className="block">
                    {/* サムネイル（安全に） */}
                    {hasAssetRef(r.mainImage) ? (
                      <Image
                        src={urlFor(r.mainImage).width(800).height(420).url()}
                        alt={r.title}
                        width={800}
                        height={420}
                        className="mb-2 rounded-md"
                      />
                    ) : (
                      <div className="mb-2 h-[150px] rounded-md bg-gray-100 text-gray-400 flex items-center justify-center">
                        No Image
                      </div>
                    )}
                    {/* タイトル */}
                    <h3 className="text-base font-medium hover:underline">{r.title}</h3>
                  </Link>

                  {/* 投稿日 */}
                  {r.publishedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(r.publishedAt).toLocaleDateString("ja-JP")}
                    </p>
                  )}

                  {/* 抜粋 */}
                  {r.excerpt && (
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.excerpt}</p>
                  )}

                  {/* カテゴリーバッジ（任意） */}
                  {r.categories?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.categories.map((c) => {
                        const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? "";
                        return (
                          <Link
                            key={c._id}
                            href={`/category/${cSlug}`}
                            className="text-[11px] rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700 hover:bg-gray-100"
                          >
                            {c.title}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
