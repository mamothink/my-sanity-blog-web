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
  const id =
    isRecord(post) && (typeof post["_id"] === "string" || typeof post["_id"] === "number")
      ? String(post["_id"])
      : null;
  const slug = isRecord(post) ? toSlugLocal(post["slug"]) : "";
  return String(id ?? slug ?? idx);
}

export default async function HomePage({
  searchParams,
}: {
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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((post, idx) => (
            <div key={getKey(post, idx)} className="max-w-sm mx-auto">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
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

          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-700">
            {page} / {totalPages}
          </span>

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
