// src/components/PostCard.tsx
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/image";

/** 汎用: Record 判定 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** slug を string に正規化（string / {current} / それ以外） */
function toSlug(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug) && typeof (slug as any).current === "string") return (slug as any).current;
  return "";
}

/** Sanity 画像かつ asset._ref を持つか判定 */
function hasAssetRef(img: unknown): img is { asset: { _ref: string } } {
  if (!isRecord(img)) return false;
  const asset = (img as any).asset;
  return isRecord(asset) && typeof (asset as any)._ref === "string" && (asset as any)._ref.length > 0;
}

/** urlFor の型差異を吸収して URL を返す（安全に any キャスト） */
function buildImageUrl(source: unknown, w: number, h: number): string | null {
  try {
    if (hasAssetRef(source)) {
      return urlFor(source as any).width(w).height(h).url();
    }
  } catch {}
  return null;
}

export type PostCardProps = {
  /** post が undefined/null でも落ちないように受け入れる */
  post?: Record<string, unknown> | null;
};

/** ブログカード（トップ/カテゴリ/関連記事で共通利用） */
export default function PostCard({ post }: PostCardProps) {
  // 実行時ガード：不正な要素は描画スキップ（null を返す）
  if (!isRecord(post)) return null;

  const slug = toSlug((post as any).slug);
  const href = slug ? `/${slug}` : "#";

  // 画像 URL（無い/壊れている場合はデフォルト画像）
  const imgUrl = buildImageUrl((post as any).mainImage, 800, 500) ?? "/default-og.png";

  const title =
    typeof (post as any).title === "string" && (post as any).title.trim()
      ? (post as any).title
      : "No Title";
  const excerpt = typeof (post as any).excerpt === "string" ? (post as any).excerpt : "";

  const date =
    typeof (post as any).publishedAt === "string" && (post as any).publishedAt
      ? new Date((post as any).publishedAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  // カテゴリを string[] に正規化
  const tags: string[] =
    Array.isArray((post as any).categories) && (post as any).categories.length > 0
      ? (post as any).categories
          .map((c: unknown) => (isRecord(c) && typeof c.title === "string" ? c.title : ""))
          .filter((t: string): t is string => Boolean(t))
      : [];

  return (
    <article
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_25px_45px_-30px_rgba(79,70,229,0.45)] ring-1 ring-indigo-100/60 backdrop-blur transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_32px_60px_-28px_rgba(79,70,229,0.55)]"
    >
      <Link
        href={href}
        className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        {/* 画像：常に 16:10 で統一（デフォルト画像も同じ比率） */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-50">
          <Image
            src={imgUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>

        {/* 本文：高さを均すため flex-1 で伸縮 */}
        <div className="flex flex-1 flex-col p-6">
          {/* タグ */}
          {tags.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1.5">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] leading-none text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 日付 */}
          {date && (
            <time className="block text-xs font-medium uppercase tracking-wide text-indigo-500">{date}</time>
          )}

          {/* タイトル */}
          <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-gray-900">
            {title}
          </h2>

          {/* 抜粋（下端に余白を残す） */}
          {excerpt && <p className="mt-3 line-clamp-3 text-sm text-gray-600">{excerpt}</p>}

          {/* フッター余白（高さ合わせ） */}
          <div className="mt-auto pt-3" />
        </div>
      </Link>
    </article>
  );
}
