// src/app/page.tsx
import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

type PageData = {
  total: number;
  items: Record<string, unknown>[];
};

const PER_PAGE = 8;

/** 安全にオブジェクト判定 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** slug を安全に取り出す（string or {current} どちらでもOK） */
function toSlugLocal(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug)) {
    const cur = (slug as Record<string, unknown>)["current"];
    if (typeof cur === "string") return cur;
  }
  return "";
}

/** key 生成（_id → slug → idx の順でフォールバック） */
function getKey(post: Record<string, unknown>, idx: number): string {
  const id =
    isRecord(post) && (typeof (post as any)._id === "string" || typeof (post as any)._id === "number")
      ? String((post as any)._id)
      : null;
  const slug = isRecord(post) ? toSlugLocal((post as any)["slug"]) : "";
  return String(id ?? slug ?? idx);
}

export default async function HomePage({
  searchParams,
}: {
  // Next.js 15 では searchParams は Promise として受け取って await が必要
  searchParams?: Promise<{ page?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const pageNum = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const data = await client.fetch<PageData>(POSTS_PAGE_QUERY, { start, end });
  const posts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Blog</h1>
        <p className="mt-2 text-sm text-gray-600">最近の投稿</p>
      </header>

      {!posts.length && <p>まだ記事がありません。</p>}

      {posts.length > 0 && (
        // ★ 重要：Tailwind のブレークポイントに依存せず、CSS Grid を直接指定
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {posts
            .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
            .map((post, idx) => (
              <PostCard key={getKey(post, idx)} post={post} />
            ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
          {/* Prev */}
          <Link
            href={page > 1 ? `/?page=${page - 1}` : "#"}
            aria-disabled={page <= 1}
            className={`rounded-full border px-3 py-1.5 ${
              page <= 1
                ? "pointer-events-none border-neutral-200 text-neutral-300"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            ← 前へ
          </Link>

          {/* Page indicator */}
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-700">
            {page} / {totalPages}
          </span>

          {/* Next */}
          <Link
            href={page < totalPages ? `/?page=${page + 1}` : "#"}
            aria-disabled={page >= totalPages}
            className={`rounded-full border px-3 py-1.5 ${
              page >= totalPages
                ? "pointer-events-none border-neutral-200 text-neutral-300"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            次へ →
          </Link>
        </nav>
      )}
    </main>
  );
}
