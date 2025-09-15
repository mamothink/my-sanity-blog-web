import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity.client";
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// ===== 型 =====
type Slug = string | { current: string };

type SanityImage = {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
};

type AuthorRef = {
  _id: string;
  name?: string;
  slug?: Slug;
  picture?: SanityImage;
};

type CategoryRef = {
  _id: string;
  title: string;
  slug: Slug;
};

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
  category?: { _id: string; title: string; description?: string; slug: string | { current: string } };
  posts?: PostSummary[];
} | null;

type Params = { slug: string };

// 静的パス
export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(ALL_CATEGORY_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

// SEO
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) return { title: "Category not found" };
  return {
    title: `${data.category.title} – Category`,
    description: data.category.description || `${data.category.title} に属する記事一覧`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) notFound();

  const { category, posts = [] } = data!;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          {typeof category!.slug === "string" ? category!.slug : category!.title}
        </h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
        )}
      </header>

      {!posts.length && <p>このカテゴリーにはまだ記事がありません。</p>}

      <ul className="space-y-6">
        {posts.map((post) => {
          const postSlug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";
          return (
            <li key={post._id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">
                <Link href={`/${postSlug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              {post.publishedAt && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                </p>
              )}

              {post.excerpt && <p className="mt-2 text-gray-700">{post.excerpt}</p>}

              {post.mainImage && (
                <div className="mt-3">
                  <Image
                    src={urlFor(post.mainImage).width(800).height(420).url()}
                    alt={post.title}
                    width={800}
                    height={420}
                    className="rounded-lg"
                  />
                </div>
              )}

              {post.categories?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.categories.map((c) => {
                    const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? "";
                    return (
                      <Link
                        key={c._id}
                        href={`/category/${cSlug}`}
                        className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        {c.title}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
