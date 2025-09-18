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
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-indigo-50 bg-white/95 shadow-md shadow-indigo-100 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl"
    >
      <Link
        href={href}
        className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      >
        {/* 画像：ワイド比率で統一し、大きめにトリミング */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100">
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              {tags.join(" / ")}
            </p>
          )}

          {/* タイトル */}
          <h2 className="mt-3 line-clamp-2 text-xl font-bold leading-snug text-slate-900">
            {title}
          </h2>

          {/* 日付 */}
          {date && <time className="mt-2 block text-sm font-semibold text-slate-500">{date}</time>}

          {/* 抜粋（下端に余白を残す） */}
          {excerpt && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{excerpt}</p>}

          {/* フッター余白（高さ合わせ） */}
          <div className="mt-auto pt-4" />
        </div>
      </Link>
    </article>
  );
}
