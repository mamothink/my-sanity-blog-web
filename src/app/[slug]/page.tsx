import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity.client";
import { notFound } from "next/navigation";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

/* ---------- 小ユーティリティ ---------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toSlug(v: unknown): string {
  if (typeof v === "string") return v;
  if (isRecord(v) && typeof (v as any).current === "string")
    return (v as any).current;
  return "";
}
function hasAssetRef(img: unknown): img is { asset: { _ref: string } } {
  if (!isRecord(img)) return false;
  const asset = (img as any).asset;
  return (
    isRecord(asset) &&
    typeof (asset as any)._ref === "string" &&
    (asset as any)._ref.length > 0
  );
}
function buildImageUrl(source: unknown, w: number, h: number): string | null {
  try {
    if (hasAssetRef(source)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return urlFor(source as any).width(w).height(h).url();
    }
  } catch {}
  return null;
}

/* ---------- データ型 ---------- */
type Person = { name?: string; slug?: string | { current?: string } };

type PostLite = {
  _id: string;
  title?: string;
  slug?: string | { current?: string };
  mainImage?: unknown;
  publishedAt?: string;
  author?: Person;
};

type PostDetail = {
  _id: string;
  title?: string;
  slug?: string | { current?: string };
  mainImage?: unknown;
  publishedAt?: string;
  excerpt?: string;
  author?: Person;
  categories?: Array<{ _id?: string; title?: string }>;
  related?: PostLite[];
};

/* ---------- クエリ ---------- */
/**
 * 同カテゴリの記事を最大4件取得。
 * カテゴリ一致の判定は「カテゴリの title の重なり」で行っています（スキーマ差異に強い）。
 */
const POST_DETAIL_QUERY = /* groq */ `
*[_type == "post" && coalesce(slug.current, slug) == $slug][0]{
  _id, title, slug, mainImage, publishedAt, excerpt,
  author->{ name, slug },
  categories[]->{ _id, title },

  "related": *[
    _type == "post" &&
    _id != ^._id &&
    count(categories[]->title[@ in ^.categories[]->title]) > 0
  ] | order(publishedAt desc)[0...4]{
    _id, title, "slug": coalesce(slug.current, slug),
    mainImage, publishedAt, author->{ name }
  }
}
`;

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<PostDetail | null>(POST_DETAIL_QUERY, { slug });
  if (!post?._id) return notFound();

  const title =
    typeof post.title === "string" && post.title.trim()
      ? post.title
      : "No Title";

  const date =
    typeof post.publishedAt === "string" && post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const authorName =
    isRecord(post.author) && typeof post.author?.name === "string"
      ? post.author.name
      : null;
  const authorSlug = isRecord(post.author) ? toSlug(post.author?.slug) : "";

  // 16:10 に合わせて生成（CSSでも16:10を担保）
  const heroUrl = buildImageUrl(post.mainImage, 1200, 750) ?? "/default-og.png";

  return (
    <main className="px-4 py-10 max-w-none">
      <article>
        {/* タイトル */}
        <header className="mx-auto max-w-3xl mb-6" style={{ maxWidth: 768 }}>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

          {/* 日付 & 著者 */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            {date && <time>{date}</time>}
            {date && authorName && <span aria-hidden>・</span>}
            {authorName && authorSlug ? (
              <Link
                href={`/author/${authorSlug}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {authorName}
              </Link>
            ) : authorName ? (
              <span>{authorName}</span>
            ) : null}
          </div>
        </header>

        {/* 見出し画像：中央寄せ・max-w-3xl・16:10（width/height 版で安定） */}
        <div className="mx-auto max-w-3xl mb-6" style={{ maxWidth: 768 }}>
          <div className="relative w-full overflow-hidden rounded-xl bg-gray-100">
            <div className="aspect-[16/10] w-full">
              <Image
                src={heroUrl}
                alt={title}
                width={1200}
                height={750}
                className="block h-auto w-full rounded-xl object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* 抜粋 */}
        {typeof post.excerpt === "string" && post.excerpt && (
          <p className="mx-auto max-w-3xl mb-8 text-gray-700" style={{ maxWidth: 768 }}>
            {post.excerpt}
          </p>
        )}

        {/* ===== 関連記事 ===== */}
        {Array.isArray(post.related) && post.related.length > 0 && (
          <section className="mx-auto max-w-3xl mt-12" style={{ maxWidth: 768 }}>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">関連記事</h2>

            <ul className="grid gap-6 sm:grid-cols-2">
              {post.related.map((rp) => {
                const rTitle =
                  typeof rp.title === "string" && rp.title.trim()
                    ? rp.title
                    : "Untitled";
                const rSlug = toSlug(rp.slug);
                const rHref = rSlug ? `/${rSlug}` : "#";
                const rImg = buildImageUrl(rp.mainImage, 600, 375); // 16:10 相当

                return (
                  <li key={rp._id} className="group">
                    <Link href={rHref} className="block">
                      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
                        <div className="aspect-[16/10] w-full">
                          {rImg ? (
                            <Image
                              src={rImg}
                              alt={rTitle}
                              width={600}
                              height={375}
                              className="block h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              sizes="(max-width: 768px) 100vw, 368px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-base font-medium leading-snug line-clamp-2">
                        {rTitle}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
