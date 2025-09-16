// src/app/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { client } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

// ===== 型（実データは string or {current} が混在する可能性がある） =====
type Slug = string | { current?: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type CategoryRef = { _id: string; title: string; slug: Slug };
type AuthorRef = { _id: string; name?: string; slug?: Slug };

type Post = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: unknown;
  publishedAt?: string;
  excerpt?: string;
  body?: unknown;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

// ---- helpers ----
function hasAssetRef(img: unknown): img is SanityImage {
  if (!img || typeof img !== "object") return false;
  const rec = img as Record<string, unknown>;
  const asset = rec["asset"] as Record<string, unknown> | undefined;
  return typeof asset?._ref === "string";
}
function toSlug(s?: Slug): string {
  if (!s) return "";
  if (typeof s === "string") return s;
  return s.current ?? "";
}
function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

// 共有ユーティリティ（関連記事の key 生成に使用）
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toSlugLocal(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug)) {
    const cur = slug["current"];
    if (typeof cur === "string") return cur;
  }
  return "";
}
function getKey(post: Record<string, unknown>, idx: number): string {
  const idVal = post["_id"];
  const id = typeof idVal === "string" || typeof idVal === "number" ? String(idVal) : null;
  const slug = toSlugLocal(post["slug"]);
  return String(id ?? slug ?? idx);
}

// ===== OGP / SEO =====
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: params.slug });
  if (!post) return { title: "記事が見つかりません" };

  const ogImage = hasAssetRef(post.mainImage)
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "/default-og.png";

  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} の記事詳細`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      url: `/${toSlug(post.slug)}`,
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
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: params.slug });
  if (!post) return notFound();

  // 関連記事（同じカテゴリ、本人除外）
  const categoryIds = post.categories?.map((c) => c._id).filter(Boolean) ?? [];
  const relatedRaw =
    categoryIds.length > 0
      ? await client.fetch<unknown[]>(RELATED_POSTS_QUERY, {
          categoryIds,
          currentPostId: post._id,
        })
      : [];

  // PostCard は Record<string, unknown> を受け付けるため、実行時チェックを兼ねて型を緩める
  const related = relatedRaw.filter(isRecord) as Record<string, unknown>[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article>
        {/* サムネイル */}
        {hasAssetRef(post.mainImage) ? (
          <div className="mb-6 overflow-hidden rounded-xl">
            <Image
              src={urlFor(post.mainImage).width(1200).height(630).url()}
              alt={post.title}
              width={1200}
              height={630}
              priority
              className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null}

        {/* タイトル */}
        <h1 className="mb-2 text-3xl font-bold leading-tight">{post.title}</h1>

        {/* 日付と著者 */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : null}
          {post.author?.name ? (
            <>
              <span>·</span>
              <Link href={`/author/${toSlug(post.author.slug)}`} className="hover:underline">
                {post.author.name}
              </Link>
            </>
          ) : null}
        </div>

        {/* 抜粋 */}
        {post.excerpt && <p className="mb-6 text-gray-700">{post.excerpt}</p>}

        {/* カテゴリーリンク */}
        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((c) => (
              <Link
                key={c._id}
                href={`/category/${toSlug(c.slug)}`}
                className="text-xs rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
              >
                {c.title}
              </Link>
            ))}
          </div>
        ) : null}
      </article>

      {/* === 関連記事（PostCard で統一） === */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">関連記事</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((r, idx) => (
              <PostCard key={getKey(r, idx)} post={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
