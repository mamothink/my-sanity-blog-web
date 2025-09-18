// src/app/page.tsx
import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { HOMEPAGE_SIDEBAR_QUERY, POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

type PageData = {
  total: number;
  items: Record<string, unknown>[];
};

type SidebarData = {
  ebook?: Record<string, unknown> | null;
  categories?: Array<Record<string, unknown>>;
  popularPosts?: Array<Record<string, unknown>>;
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
  if (typeof slug === "string" && slug.trim()) return slug.trim();
  if (isRecord(slug) && typeof (slug as any).current === "string") {
    const cur = (slug as any).current.trim();
    if (cur) return cur;
  }
  return "";
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstString(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): string {
  if (!record) return "";
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "";
}

function extractPortableTextSummary(value: unknown): string {
  if (!Array.isArray(value)) return "";
  for (const block of value) {
    if (!isRecord(block)) continue;
    const type = getString((block as Record<string, unknown>)._type);
    if (type !== "block") continue;
    const children = (block as Record<string, unknown>).children;
    if (!Array.isArray(children)) continue;
    const text = children
      .map((child) => (isRecord(child) ? getString((child as Record<string, unknown>).text) : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  return "";
}

function normalizeHref(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (value.startsWith("#")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    return url.toString();
  } catch {}
  return "";
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export default async function HomePage() {
  let postsData: PageData | null = null;
  let sidebarData: SidebarData | null = null;

  const [postsResult, sidebarResult] = await Promise.allSettled([
    client.fetch<PageData>(POSTS_PAGE_QUERY, { start: 0, end: PER_PAGE }),
    client.fetch<SidebarData>(HOMEPAGE_SIDEBAR_QUERY),
  ]);

  if (postsResult.status === "fulfilled") {
    postsData = postsResult.value;
  } else {
    console.error("[HomePage] Failed to load posts", postsResult.reason);
  }

  if (sidebarResult.status === "fulfilled") {
    sidebarData = sidebarResult.value;
  } else {
    console.error("[HomePage] Failed to load sidebar", sidebarResult.reason);
  }

  const posts = Array.isArray(postsData?.items) ? (postsData?.items as Record<string, unknown>[]) : [];
  const typedPosts = posts.filter((p): p is Record<string, unknown> => isRecord(p));
  const shouldShowPlaceholders = typedPosts.length === 0 && process.env.NODE_ENV !== "production";
  const placeholderPosts: Record<string, unknown>[] = shouldShowPlaceholders
    ? Array.from({ length: 4 }, (_, idx) => ({ _id: `placeholder-${idx}` }))
    : [];
  const postsToRender = shouldShowPlaceholders ? placeholderPosts : typedPosts;

  const ebookRecord = isRecord(sidebarData?.ebook) ? sidebarData.ebook : null;
  const ebookTitle = getFirstString(ebookRecord, ["title", "name"]);
  const ebookDescription =
    getFirstString(ebookRecord, ["description", "summary", "bodyText"]) ||
    extractPortableTextSummary(ebookRecord?.["body"]);
  const ebookLink = ebookRecord
    ? normalizeHref(getFirstString(ebookRecord, ["ctaUrl", "ctaLink", "url", "link", "href"]))
    : "";
  const ebookLinkLabelRaw = ebookRecord
    ? getFirstString(ebookRecord, ["ctaLabel", "buttonLabel", "linkLabel", "actionLabel"])
    : "";
  const ebookLinkLabel =
    ebookLink && ebookLinkLabelRaw && ebookLinkLabelRaw !== ebookTitle ? ebookLinkLabelRaw : "";

  const rawCategories = Array.isArray(sidebarData?.categories) ? sidebarData.categories : [];
  const categories: { id: string; title: string; href: string }[] = [];
  const seenCategoryHrefs = new Set<string>();
  for (const item of rawCategories) {
    if (!isRecord(item)) continue;
    const title = getString((item as any).title);
    const slug = toSlug((item as any).slug);
    const href = slug ? `/category/${slug}` : "";
    if (!title || !href || seenCategoryHrefs.has(href)) continue;
    seenCategoryHrefs.add(href);
    const idCandidate = getString((item as any)._id);
    categories.push({
      id: idCandidate || href || `${title}-${categories.length}`,
      title,
      href,
    });
  }

  const ranking: { id: string; title: string; href: string }[] = [];
  const rawPopular = Array.isArray(sidebarData?.popularPosts) ? sidebarData.popularPosts : [];
  const seenRankingHrefs = new Set<string>();
  for (const item of rawPopular) {
    if (!isRecord(item)) continue;
    const title = getString((item as any).title);
    const slug = toSlug((item as any).slug);
    const href = slug ? `/${slug}` : "";
    if (!title || !href || seenRankingHrefs.has(href)) continue;
    seenRankingHrefs.add(href);
    const idCandidate = getString((item as any)._id);
    ranking.push({
      id: idCandidate || href || `${title}-${ranking.length}`,
      title,
      href,
    });
  }

  if (ranking.length === 0 && !shouldShowPlaceholders) {
    for (const post of typedPosts) {
      if (ranking.length >= 5) break;
      const title = getString((post as any).title);
      const slug = toSlug((post as any).slug);
      const href = slug ? `/${slug}` : "";
      if (!title || !href || seenRankingHrefs.has(href)) continue;
      seenRankingHrefs.add(href);
      const idCandidate = getString((post as any)._id);
      ranking.push({
        id: idCandidate || href || `${title}-${ranking.length}`,
        title,
        href,
      });
    }
  }

  const sidebarCardClasses =
    "group rounded-3xl border border-indigo-50 bg-white/95 p-6 shadow-md shadow-indigo-100 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl";

  const containerClasses =
    "mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16";
  const layoutClasses = "home-layout";
  const postsGridClasses = "home-posts-grid grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2";

  return (
    <div className={containerClasses}>
      <div className={layoutClasses}>
        <section className="lg:min-w-0">
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

        <aside className="space-y-8 lg:col-span-1 lg:row-start-1 lg:sticky lg:top-28">
          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">電子書籍の紹介</h2>
            {ebookTitle && (
              <div className="mt-3">
                {ebookLink ? (
                  isExternalHref(ebookLink) ? (
                    <a
                      href={ebookLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-base font-semibold text-slate-900 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {ebookTitle}
                    </a>
                  ) : (
                    <Link
                      href={ebookLink}
                      className="inline-flex items-center gap-1 text-base font-semibold text-slate-900 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {ebookTitle}
                    </Link>
                  )
                ) : (
                  <p className="text-base font-semibold text-slate-900">{ebookTitle}</p>
                )}
              </div>
            )}
            {ebookDescription && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{ebookDescription}</p>
            )}
            {ebookLink && ebookLinkLabel && (
              isExternalHref(ebookLink) ? (
                <a
                  href={ebookLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {ebookLinkLabel}
                </a>
              ) : (
                <Link
                  href={ebookLink}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {ebookLinkLabel}
                </Link>
              )
            )}
          </section>

          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">カテゴリー一覧</h2>
            {categories.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                {categories.slice(0, 12).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={category.href}
                      className="flex items-center justify-between rounded-full border border-indigo-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <span>{category.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={sidebarCardClasses}>
            <h2 className="text-lg font-semibold text-slate-900">人気記事ランキング</h2>
            {ranking.length > 0 && (
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                {ranking.slice(0, 5).map((post, idx) => (
                  <li key={post.id}>
                    <Link
                      href={post.href}
                      className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-100 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <span className="mt-0.5 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-left leading-relaxed">{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
