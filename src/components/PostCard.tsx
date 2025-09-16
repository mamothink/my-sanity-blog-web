// src/components/PostCard.tsx
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/image";

// Sanity image guard
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
function hasAssetRef(img: unknown): img is SanityImage {
  if (!img || typeof img !== "object") return false;
  const rec = img as Record<string, unknown>;
  const asset = rec["asset"] as Record<string, unknown> | undefined;
  return typeof asset?._ref === "string";
}

// slug が string / {current} どちらでも OK にする
type Slug = string | { current?: string };
const toSlug = (s?: Slug) => (typeof s === "string" ? s : s?.current ?? "");

// 外から受け取る最低限の形
export type PostLike = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: unknown;
  publishedAt?: string;
  excerpt?: string;
  // 任意: カテゴリと著者（あれば表示）
  categories?: { _id: string; title: string; slug: Slug }[];
  author?: { _id: string; name?: string; slug?: Slug };
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default function PostCard({
  post,
  showExcerpt,
  showCategories,
}: {
  post: PostLike;
  showExcerpt?: boolean;
  showCategories?: boolean;
}) {
  const pSlug = toSlug(post.slug);

  return (
    <li className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/${pSlug}`} className="block">
        {/* サムネイル */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {hasAssetRef(post.mainImage) ? (
            <Image
              src={urlFor(post.mainImage).width(800).height(500).url()}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
              No Image
            </div>
          )}
          {/* 画像左上のカテゴリーバッジ（最大2件） */}
          {showCategories &&
            post.categories?.slice(0, 2).map((c) => (
              <span
                key={c._id}
                className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow"
              >
                {c.title}
              </span>
            ))}
        </div>

        {/* 本文 */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
            {post.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
            {post.publishedAt && <time>{fmtDate(post.publishedAt)}</time>}
            {post.author?.name && (
              <>
                <span>·</span>
                <Link href={`/author/${toSlug(post.author.slug)}`} className="hover:underline">
                  {post.author.name}
                </Link>
              </>
            )}
          </div>

          {showExcerpt && post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
          )}
        </div>
      </Link>

      {/* 下部：カテゴリリンク（任意） */}
      {showCategories && post.categories?.length ? (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {post.categories.map((c) => (
            <Link
              key={c._id}
              href={`/category/${toSlug(c.slug)}`}
              className="text-[11px] rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700 hover:bg-gray-100"
            >
              {c.title}
            </Link>
          ))}
        </div>
      ) : null}
    </li>
  );
}
