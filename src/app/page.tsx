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
  let data: PageData | null = null;

  try {
    data = await client.fetch<PageData>(POSTS_PAGE_QUERY, { start: 0, end: PER_PAGE });
  } catch (error) {
    console.error("[HomePage] Failed to load posts", error);
  }

  const posts = Array.isArray(data?.items) ? (data?.items as Record<string, unknown>[]) : [];
  const typedPosts = posts.filter((p): p is Record<string, unknown> => isRecord(p));
  const shouldShowPlaceholders = typedPosts.length === 0 && process.env.NODE_ENV !== "production";
  const placeholderPosts: Record<string, unknown>[] = shouldShowPlaceholders
    ? Array.from({ length: 4 }, (_, idx) => ({ _id: `placeholder-${idx}` }))
    : [];
  const postsToRender = shouldShowPlaceholders ? placeholderPosts : typedPosts;

  const sidebarCardClasses =
    "group rounded-3xl border border-indigo-50 bg-white/95 p-6 shadow-md shadow-indigo-100 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
        <section className="lg:min-w-0 lg:flex-1">
          {postsToRender.length > 0 ? (
            <div className="home-posts-grid grid grid-cols-1 gap-8">
              {postsToRender.map((post, idx) => (
                <PostCard key={getKey(post, idx)} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">まだ記事がありません。</p>
          )}
        </section>

        <aside className="space-y-8 lg:sticky lg:top-28 lg:w-[320px] lg:flex-none">
          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">電子書籍の紹介</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>・電子書籍タイトルAの紹介文が入ります。</li>
              <li>・電子書籍タイトルBの紹介文が入ります。</li>
            </ul>
          </section>

          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">カテゴリー一覧</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>・カテゴリー1</li>
              <li>・カテゴリー2</li>
              <li>・カテゴリー3</li>
              <li>・カテゴリー4</li>
            </ul>
          </section>

          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">人気記事ランキング</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>1. 人気記事タイトルサンプル</li>
              <li>2. 人気記事タイトルサンプル</li>
              <li>3. 人気記事タイトルサンプル</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
