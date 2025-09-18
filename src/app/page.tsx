// src/app/page.tsx
import { client } from "@/lib/sanity.client";
import Link from "next/link";
import { POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import SidebarCard from "@/components/SidebarCard";

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

function toSlug(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug) && typeof (slug as any).current === "string") return (slug as any).current;
  return "";
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
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

  const ebookItems = ["電子書籍タイトルA", "電子書籍タイトルB", "電子書籍タイトルC"];

  const categoryTitles = new Set<string>();
  typedPosts.forEach((post) => {
    const categories = Array.isArray((post as any).categories) ? (post as any).categories : [];
    categories.forEach((category) => {
      if (isRecord(category) && typeof (category as any).title === "string" && (category as any).title.trim()) {
        categoryTitles.add((category as any).title);
      }
    });
  });
  const categoriesList = Array.from(categoryTitles);
  const fallbackCategories = ["カテゴリー1", "カテゴリー2", "カテゴリー3", "カテゴリー4"];
  const categoriesToRender = categoriesList.length > 0 ? categoriesList : fallbackCategories;

  const popularPosts = typedPosts
    .map((post) => {
      const title = typeof (post as any).title === "string" && (post as any).title.trim() ? (post as any).title : null;
      if (!title) return null;
      const slug = toSlug((post as any).slug);
      const publishedAt = toTimestamp((post as any).publishedAt);
      return { title, slug, publishedAt };
    })
    .filter((item): item is { title: string; slug: string; publishedAt: number | null } => item !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, 5);
  const fallbackPopular = Array.from({ length: 3 }, () => ({ title: "人気記事タイトルサンプル", slug: "", publishedAt: null }));
  const popularToRender = popularPosts.length > 0 ? popularPosts : fallbackPopular;

  const containerClasses =
    "mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16";
  const layoutClasses = "grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14";
  const postsGridClasses = "home-posts-grid grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2";

  return (
    <div className={containerClasses}>
      <div className={layoutClasses}>
        <section className="lg:min-w-0 lg:flex-1">
          {postsToRender.length > 0 ? (
            <div className={postsGridClasses}>
              {postsToRender.map((post, idx) => (
                <PostCard key={getKey(post, idx)} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">まだ記事がありません。</p>
          )}
        </section>

        <aside className="space-y-8 lg:sticky lg:top-28 lg:w-[320px] lg:flex-none">
          <SidebarCard title="電子書籍の紹介">
            <ul className="space-y-2">
              {ebookItems.map((item) => (
                <li key={item}>・{item}</li>
              ))}
            </ul>
          </SidebarCard>

          <SidebarCard title="カテゴリー一覧">
            <ul className="space-y-2">
              {categoriesToRender.map((title) => (
                <li key={title}>・{title}</li>
              ))}
            </ul>
          </SidebarCard>

          <SidebarCard title="人気記事ランキング">
            <ol className="space-y-3">
              {popularToRender.map((item, idx) => (
                <li key={`${item.slug || item.title}-${idx}`} className="flex items-start gap-2">
                  <span className="text-indigo-500">{idx + 1}.</span>
                  {item.slug ? (
                    <Link
                      href={`/${item.slug}`}
                      className="flex-1 text-slate-700 transition-colors duration-200 hover:text-indigo-500 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="flex-1 text-slate-700">{item.title}</span>
                  )}
                </li>
              ))}
            </ol>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}
