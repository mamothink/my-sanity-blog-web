import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard, { type PostCardProps } from "@/components/PostCard";

export const revalidate = 60;

type PageData = {
  total: number;
  items: PostCardProps["post"][]; // ← any禁止：PostCardのpost型を再利用
};

const PER_PAGE = 8;

function toSlugLocal(slug: PostCardProps["post"]["slug"]): string {
  if (!slug) return "";
  if (typeof slug === "string") return slug;
  return slug.current ?? "";
}

function getKey(post: PostCardProps["post"], idx: number): string {
  const id = (post as { _id?: string | number | null | undefined })?._id;
  const slug = toSlugLocal(post.slug);
  return String(id ?? slug ?? idx);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const data = await client.fetch<PageData>(POSTS_PAGE_QUERY, { start, end });
  const posts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Blog</h1>
        <p className="mt-2 text-sm text-gray-600">最近の投稿</p>
      </header>

      {!posts.length && <p>まだ記事がありません。</p>}

      {posts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, idx) => (
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
