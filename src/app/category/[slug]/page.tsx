import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity.client";
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// 型
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type AuthorRef = { _id: string; name?: string; slug?: Slug; picture?: SanityImage };
type CategoryRef = { _id: string; title: string; slug: Slug };

type PostSummary = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: SanityImage;
  publishedAt?: string;
  excerpt?: string;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

type CategoryPageData = {
  category?: { _id: string; title: string; description?: string; slug: Slug };
  posts?: PostSummary[];
} | null;

type Params = { slug: string };

// 静的生成
export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(ALL_CATEGORY_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

// SEO
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) return { title: "Category not found" };
  const catTitle =
    typeof data.category.slug === "string" ? data.category.slug : data.category.title;
  return {
    title: `${catTitle} – Category`,
    description: data.category.description || `${catTitle} に属する記事一覧`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) notFound();

  const { category, posts = [] } = data!;

  const catTitle =
    typeof category!.slug === "string" ? category!.slug : category!.title;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ヘッダー帯 */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 ring-1 ring-gray-100">
        <h1 className="text-2xl font-bold tracking-tight">{catTitle}</h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{posts.length} 件</p>
      </section>

      {!posts.length && <p>このカテゴリーにはまだ記事がありません。</p>}

      {/* カード一覧 */}
      <ul className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => {
          const postSlug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";
          return (
            <li
              key={post._id}
              className="group overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg"
            >
              {post.mainImage && (
                <Link href={`/${postSlug}`} className="block overflow-hidden">
                  <Image
                    src={urlFor(post.mainImage).width(1200).height(630).url()}
                    alt={post.title}
                    width={1200}
                    height={630}
                    className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
              )}

              <div className="p-5">
                {/* カテゴリーバッジ（自分自身を含め表示） */}
                {post.categories?.length ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.categories.map((c) => {
                      const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? "";
                      return (
                        <Link
                          key={c._id}
                          href={`/category/${cSlug}`}
                          className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          {c.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                <h2 className="text-lg font-semibold">
                  <Link href={`/${postSlug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                <div className="mt-1 text-xs text-gray-500">
                  {post.publishedAt &&
                    new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                  {post.author?.name && (
                    <>
                      {" "}
                      · by{" "}
                      <Link
                        href={`/author/${
                          typeof post.author.slug === "string"
                            ? post.author.slug
                            : post.author.slug?.current ?? ""
                        }`}
                        className="underline hover:no-underline"
                      >
                        {post.author.name}
                      </Link>
                    </>
                  )}
                </div>

                {post.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm text-gray-700">{post.excerpt}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
