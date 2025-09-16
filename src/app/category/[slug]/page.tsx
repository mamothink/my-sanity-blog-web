import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

/** PostCard に合わせ、受け取りは緩い型でOK（anyは使わない） */
type Slug = string | { current?: string } | null | undefined;
type PostLike = {
  _id?: string | number | null;
  slug?: Slug;
  [key: string]: unknown;
};

type CategoryPageData = {
  title?: string | null;
  items?: PostLike[];
  posts?: PostLike[];
  total?: number;
};

const PER_PAGE = 8;

/* ユーティリティ */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toSlugLocal(slug: Slug): string {
  if (!slug) return "";
  if (typeof slug === "string") return slug;
  return slug.current ?? "";
}
function getKey(post: PostLike, idx: number): string {
  const id = post?._id;
  const slug = toSlugLocal(post?.slug ?? "");
  return String(id ?? slug ?? idx);
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  // Next.js 15: searchParams は Promise を await
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug } = params;

  const sp = (await searchParams) ?? {};
  const pageNum = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, {
    slug,
    start,
    end,
  });

  const posts = (data.items ?? data.posts ?? []) as PostLike[];
  const total = typeof data.total === "number" ? data.total : posts.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const title = data.title ?? slug;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">カテゴリ：{title}</h1>
        <p className="mt-2 text-sm text-gray-600">このカテゴリの投稿一覧</p>
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
            href={page > 1 ? `/category/${slug}?page=${page - 1}` : "#"}
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
            href={page < totalPages ? `/category/${slug}?page=${page + 1}` : "#"}
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
