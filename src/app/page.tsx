// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { POSTS_PAGE_QUERY } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

type PageData = {
  total: number;
  items: Record<string, unknown>[];
};

const PER_PAGE = 8;

type Category = {
  _id: string;
  title: string;
  slug: string;
};

const CATEGORIES_QUERY = `
  *[_type == "category" && defined(slug.current)]
    | order(title asc){
      _id,
      title,
      "slug": slug.current
    }
`;

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

function hasAssetRef(img: unknown): img is { asset: { _ref: string } } {
  if (!isRecord(img)) return false;
  const asset = (img as any).asset;
  return isRecord(asset) && typeof (asset as any)._ref === "string" && (asset as any)._ref.length > 0;
}

function buildHeroImageUrl(source: unknown, width: number, height: number): string | null {
  try {
    if (hasAssetRef(source)) {
      return urlFor(source as any).width(width).height(height).url();
    }
  } catch {}
  return null;
}

function getCategories(post: Record<string, unknown>): string[] {
  const raw = (post as any).categories;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: unknown) => (isRecord(c) && typeof c.title === "string" ? c.title : ""))
    .filter((title: string): title is string => Boolean(title));
}

function getDate(post: Record<string, unknown>): string | null {
  const published = typeof (post as any).publishedAt === "string" ? (post as any).publishedAt : null;
  if (!published) return null;
  return new Date(published).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTitle(post: Record<string, unknown>): string {
  return typeof (post as any).title === "string" && (post as any).title.trim() ? (post as any).title : "No Title";
}

function getExcerpt(post: Record<string, unknown>): string {
  return typeof (post as any).excerpt === "string" ? (post as any).excerpt : "";
}

function FeaturedPost({ post }: { post: Record<string, unknown> }) {
  const slug = toSlugLocal((post as any).slug);
  if (!slug) return null;

  const href = `/${slug}`;
  const title = getTitle(post);
  const excerpt = getExcerpt(post);
  const date = getDate(post);
  const categories = getCategories(post);
  const imageUrl = buildHeroImageUrl((post as any).mainImage, 1200, 700) ?? "/default-og.png";

  return (
    <article className="overflow-hidden rounded-[36px] border border-white/60 bg-white/90 shadow-[0_32px_70px_-40px_rgba(79,70,229,0.55)] ring-1 ring-indigo-100/70 backdrop-blur">
      <Link
        href={href}
        className="grid h-full gap-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:grid-cols-2"
      >
        <div className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        <div className="flex flex-col justify-between gap-6 p-8">
          <div className="space-y-4">
            {categories.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                {categories.join(" / ")}
              </p>
            )}
            {date && <time className="block text-xs font-medium uppercase tracking-[0.2em] text-indigo-500">{date}</time>}
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h2>
            {excerpt && <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">{excerpt}</p>}
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            記事を読む
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </article>
  );
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

  const [data, categories] = await Promise.all([
    client.fetch<PageData>(POSTS_PAGE_QUERY, { start, end }),
    client.fetch<Category[]>(CATEGORIES_QUERY),
  ]);

  const posts = data?.items ?? [];
  const typedPosts = posts.filter((p): p is Record<string, unknown> => isRecord(p));
  const [featuredPost, ...restPosts] = typedPosts;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-6xl space-y-16 py-8 sm:py-12 lg:py-16">
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-gradient-to-br from-indigo-100 via-white to-cyan-100 px-6 py-12 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-x-12 -top-12 h-32 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-48 w-48 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)] lg:items-center">
          <div className="space-y-6 text-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">BLOG</p>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                Web3、投資、ライフスタイルなど幅広いトピックを発信しています
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
                イケハヤが日々の気付きや知見をシェアするオウンドメディア。ビジネスやテクノロジーだけでなく、暮らしや働き方まで、実践的なヒントをお届けします。
              </p>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                {categories.slice(0, 8).map((category) => (
                  <Link key={category._id} href={`/category/${category.slug}`} className="transition-colors hover:text-indigo-400">
                    #{category.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div
            id="cta"
            className="relative rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_32px_70px_-40px_rgba(79,70,229,0.55)]"
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Special Offer</p>
              <h2 className="text-2xl font-bold text-neutral-900">無料メルマガで限定レポートを受け取ろう</h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                ブログでは語り切れない裏話や、投資・Web3の最新トピックを週1ペースでお届け。登録者限定のPDF特典も配布中です。
              </p>
            </div>
            <Link
              href="/#cta"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-0.5"
            >
              無料で特典を受け取る
              <span aria-hidden>→</span>
            </Link>
            <p className="mt-3 text-center text-xs text-neutral-400">迷ったらまずはメールでお気軽にどうぞ。</p>
          </div>
        </div>
      </section>

      {!typedPosts.length && <p className="text-sm text-neutral-500">まだ記事がありません。</p>}

      {typedPosts.length > 0 && (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
          <section className="space-y-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">最新記事</h2>
                <p className="text-sm text-neutral-500">新着コンテンツをピックアップしています。</p>
              </div>
              {totalPages > 1 && (
                <Link
                  href="/?page=2"
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  もっと見る
                  <span aria-hidden>→</span>
                </Link>
              )}
            </div>

            {featuredPost && <FeaturedPost post={featuredPost} />}

            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {restPosts.map((post, idx) => (
                  <PostCard key={getKey(post, idx + 1)} post={post} />
                ))}
              </div>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3 text-sm">
                {/* Prev */}
                <Link
                  href={page > 1 ? `/?page=${page - 1}` : "#"}
                  aria-disabled={page <= 1}
                  className={`rounded-full border px-3 py-1.5 ${
                    page <= 1
                      ? "pointer-events-none border-neutral-200 text-neutral-300"
                      : "border-indigo-100 text-neutral-700 hover:bg-indigo-50"
                  }`}
                >
                  ← 前へ
                </Link>

                {/* Page indicator */}
                <span className="rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-neutral-700">
                  {page} / {totalPages}
                </span>

                {/* Next */}
                <Link
                  href={page < totalPages ? `/?page=${page + 1}` : "#"}
                  aria-disabled={page >= totalPages}
                  className={`rounded-full border px-3 py-1.5 ${
                    page >= totalPages
                      ? "pointer-events-none border-neutral-200 text-neutral-300"
                      : "border-indigo-100 text-neutral-700 hover:bg-indigo-50"
                  }`}
                >
                  次へ →
                </Link>
              </nav>
            )}
          </section>

          <aside className="space-y-8 lg:sticky lg:top-28 lg:h-fit">
            <div
              id="about"
              className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_32px_70px_-45px_rgba(79,70,229,0.55)] backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">About</p>
              <h3 className="mt-3 text-xl font-bold text-neutral-900">イケハヤについて</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                2005年からブロガーとして活動。地方移住、資産運用、Web3領域を中心に情報発信を続けています。少し先の未来を、一緒に覗いてみませんか？
              </p>
              <Link
                href="/#about"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                プロフィールを見る
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_32px_70px_-45px_rgba(79,70,229,0.55)] backdrop-blur">
              <h3 className="text-lg font-bold text-neutral-900">イケハヤの書籍</h3>
              <p className="mt-2 text-sm text-neutral-600">学びを深めたい方はこちらもどうぞ。</p>
              <ul className="mt-5 space-y-4 text-sm text-neutral-700">
                <li>
                  <Link className="group inline-flex items-start gap-3" href="#">
                    <Image
                      src="/default-og.png"
                      alt="書籍"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900 group-hover:text-indigo-600">NFTで稼ぐ!</p>
                      <p className="text-xs text-neutral-500">最新のWeb3戦略を分かりやすく解説</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link className="group inline-flex items-start gap-3" href="#">
                    <Image
                      src="/default-og.png"
                      alt="書籍"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900 group-hover:text-indigo-600">脱サラ起業術</p>
                      <p className="text-xs text-neutral-500">個人で生き抜くための実践ノウハウ</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link className="group inline-flex items-start gap-3" href="#">
                    <Image
                      src="/default-og.png"
                      alt="書籍"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900 group-hover:text-indigo-600">地方移住計画</p>
                      <p className="text-xs text-neutral-500">田舎暮らしで豊かに暮らすヒント</p>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_32px_70px_-45px_rgba(79,70,229,0.55)] backdrop-blur">
              <h3 className="text-lg font-bold text-neutral-900">コミュニティ</h3>
              <p className="mt-2 text-sm text-neutral-600">
                オンラインサロンやイベント情報も随時発信中。仲間と一緒に学びを深めましょう。
              </p>
              <Link
                href="/#cta"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                参加方法を相談する
                <span aria-hidden>→</span>
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
