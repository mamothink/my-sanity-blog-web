// src/app/page.tsx
import { client } from "@/lib/sanity.client";
import { POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

type PageData = {
  total: number;
  items: Record<string, unknown>[];
};

const PER_PAGE = 12;

/** 安全にオブジェクト判定 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** key 生成（_id → slug → idx の順でフォールバック） */
function getKey(post: Record<string, unknown>, idx: number): string {
  const id =
    isRecord(post) && (typeof (post as any)._id === "string" || typeof (post as any)._id === "number")
      ? String((post as any)._id)
      : null;
  const slug = isRecord(post)
    ? typeof (post as any).slug === "string"
      ? (post as any).slug
      : isRecord((post as any).slug) && typeof (post as any).slug.current === "string"
        ? (post as any).slug.current
        : ""
    : "";
  return String(id ?? slug ?? idx);
}

export default async function HomePage() {
  const data = await client.fetch<PageData>(POSTS_PAGE_QUERY, { start: 0, end: PER_PAGE });

  const posts = data?.items ?? [];
  const typedPosts = posts.filter((p): p is Record<string, unknown> => isRecord(p));

  return (
    <div className="mx-auto max-w-6xl py-8 sm:py-12 lg:py-16">
      {typedPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {typedPosts.map((post, idx) => (
            <PostCard key={getKey(post, idx)} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">まだ記事がありません。</p>
      )}
    </div>
  );
}
