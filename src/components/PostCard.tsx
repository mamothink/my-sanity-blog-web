// src/components/PostCard.tsx
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/image";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toSlug(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug) && typeof slug.current === "string") return slug.current;
  return "";
}

function hasAssetRef(img: unknown): img is { asset: { _ref: string } } {
  if (!isRecord(img)) return false;
  const asset = (img as any).asset;
  return isRecord(asset) && typeof asset._ref === "string" && asset._ref.length > 0;
}

function buildImageUrl(source: unknown, w: number, h: number): string | null {
  try {
    if (hasAssetRef(source)) {
      return urlFor(source as any).width(w).height(h).url();
    }
  } catch {}
  return null;
}

export type PostCardProps = {
  post: {
    slug?: string | { current?: string } | null;
    title?: string | null;
    excerpt?: string | null;
    mainImage?: unknown;
    publishedAt?: string | null;
    categories?: Array<{ title?: string | null }> | null;
  };
};

export default function PostCard({ post }: PostCardProps) {
  const slug = toSlug(post.slug);
  const href = slug ? `/${slug}` : "#";

  const imgUrl = buildImageUrl(post.mainImage, 800, 500) ?? "/default-og.png";

  const title = typeof post.title === "string" && post.title.trim() ? post.title : "No Title";
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : "";

  const date =
    typeof post.publishedAt === "string" && post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const tags =
    Array.isArray(post.categories) && post.categories.length > 0
      ? post.categories.map((c) => (c?.title ?? "")).filter((t) => t)
      : [];

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imgUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="p-4">
          {tags.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
            {title}
          </h2>

          {date && <time className="mt-1 block text-xs text-gray-500">{date}</time>}

          {excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
