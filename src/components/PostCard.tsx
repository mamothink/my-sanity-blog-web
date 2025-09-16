// src/components/PostCard.tsx
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/image";

/** ===== 型 ===== */
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type CategoryRef = { _id: string; title: string; slug: Slug };

export type PostLike = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: unknown;
  publishedAt?: string;
  excerpt?: string;
  categories?: CategoryRef[];
};

/** ===== ユーティリティ ===== */
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
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ===== 共通カード =====
 *  - トップ/カテゴリーページのカード見た目を完全統一
 *  - propsで抜粋やカテゴリ表示のON/OFFを切り替え可能
 */
export default function PostCard({
  post,
  showExcerpt = true,
  showCategories = true,
}: {
  post: PostLike;
  showExcerpt?: boolean;
  showCategories?: boolean;
}) {
  const postSlug = toSlug(post.slug);

  return (
    <li className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/${postSlug}`} className="block">
        {/* サムネイル（比率統一） */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {hasAssetRef(post.mainImage) ? (
            <Image
              src={urlFor(post.mainImage).width(1200).height(675).url()}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-100 text-neutral-400">
              No Image
            </div>
          )}

          {/* カテゴリーバッジ（画像左上・最大2件） */}
          {showCategories &&
            post.categories?.slice(0, 2).map((c) => (
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
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900">
            {post.title}
          </h3>

          {post.publishedAt && (
            <time className="mt-1 block text-xs text-neutral-500">
              {formatDate(post.publishedAt)}
            </time>
          )}

          {showExcerpt && post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{post.excerpt}</p>
          )}
        </div>
      </Link>

      {/* カテゴリーリンク（カード下部・任意） */}
      {showCategories && post.categories?.length ? (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.categories.map((c) => (
            <Link
              key={c._id}
              href={`/category/${toSlug(c.slug)}`}
              className="text-[11px] rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
            >
              {c.title}
            </Link>
          ))}
        </div>
      ) : null}
    </li>
  );
}
