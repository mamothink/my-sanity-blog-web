// src/app/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { client } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// ===== 型（Step1に合わせて超シンプル化） =====
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type CategoryRef = { _id: string; title: string; slug: string };
type AuthorRef = { _id: string; name?: string; slug?: string };

type Post = {
  _id: string;
  title: string;
  slug: string;                 // ← 文字列に統一
  mainImage?: unknown;          // 画像は unknown として受け取り、型ガードで判定
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

// ---- 日付のフォーマッタ（見た目の統一） ----
function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

// ===== OGP / SEO =====
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: params.slug });
  if (!post) return { title: "記事が見つかりません" };

  const ogImage = hasAssetRef(post.mainImage)
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "https://your-site.com/default-og.png";

  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} の記事詳細`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      url: `https://your-site.com/${post.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      type: "article",
      publishedTime: post.publishedAt,
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
  const categoryIds = post.categories?.map((c) => c._id).filter(Boolean) ?? [];
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
          <div className="mb-6 overflow-hidden rounded-xl">
            <Image
              src={urlFor(post.mainImage).width(1200).height(630).url()}
              alt={post.title}
              width={1200}
              height={630}
              priority
              className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
              // 画面幅に応じて配信する画像サイズのヒント（軽量化）
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null}

        {/* タイトル */}
        <h1 className="mb-2 text-3xl font-bold leading-tight">{post.title}</h1>

        {/* 日付と著者 */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          ) : null}
          {post.author?.name ? (
            <>
              <span>·</span>
              <Link
                href={`/author/${post.author.slug ?? ""}`}
                className="hover:underline"
              >
                {post.author.name}
              </Link>
            </>
          ) : null}
        </div>

        {/* 抜粋 */}
        {post.excerpt && <p className="mb-6 text-gray-700">{post.excerpt}</p>}

        {/* 本文（※次のステップでPortableTextに差し替え予定） */}
        {/* <PortableText value={post.body} components={...} /> */}

        {/* カテゴリーリンク */}
        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((c) => (
              <Link
                key={c._id}
                href={`/category/${c.slug}`}
                className="text-xs rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
              >
                {c.title}
              </Link>
            ))}
          </div>
        ) : null}
      </article>

      {/* === 関連記事 === */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">関連記事</h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {related.map((r) => (
              <li
                key={r._id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm transition hover:shadow-md"
              >
                <Link href={`/${r.slug}`} className="block">
                  {/* サムネイル（安全に） */}
                  <div className="relative mb-3 overflow-hidden rounded-lg">
                    {hasAssetRef(r.mainImage) ? (
                      <Image
                        src={urlFor(r.mainImage).width(800).height(420).url()}
                        alt={r.title}
                        width={800}
                        height={420}
                        className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 50vw, 400px"
                      />
                    ) : (
                      <div className="flex h-[150px] items-center justify-center rounded-md bg-gray-100 text-gray-400">
                        No Image
                      </div>
                    )}

                    {/* 画像左上にカテゴリーバッジ（最大2件） */}
                    {r.categories?.length ? (
                      <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
                        {r.categories.slice(0, 2).map((c) => (
                          <span
                            key={c._id}
                            className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700 ring-1 ring-black/5"
                          >
                            {c.title}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* タイトル */}
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
                    {r.title}
                  </h3>

                  {/* 投稿日 & 抜粋 */}
                  <div className="mt-1 text-xs text-gray-500">
                    {r.publishedAt ? <time dateTime={r.publishedAt}>{formatDate(r.publishedAt)}</time> : null}
                  </div>
                  {r.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-700">{r.excerpt}</p>
                  ) : null}
                </Link>

                {/* カテゴリーバッジリンク（任意） */}
                {r.categories?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.categories.map((c) => (
                      <Link
                        key={c._id}
                        href={`/category/${c.slug}`}
                        className="text-[11px] rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700 hover:bg-gray-100"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
