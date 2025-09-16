import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { client } from "@/lib/sanity.client";
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from "@/lib/queries";
import PostCard, { type PostLike } from "@/components/PostCard";

export const revalidate = 60;

// 型
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type AuthorRef = { _id: string; name?: string; slug?: Slug; picture?: SanityImage };

type PostSummary = PostLike & {
  author?: AuthorRef;
};

type CategoryPageData = {
  category?: { _id: string; title: string; description?: string; slug: Slug };
  posts?: PostSummary[];
} | null;

type Params = { slug: string };

// helpers
function toSlug(s?: Slug) {
  return typeof s === "string" ? s : s?.current ?? "";
}

// 静的生成
export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(ALL_CATEGORY_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

// SEO
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) return { title: "Category not found" };
  const cat = data.category;
  return {
    title: `${cat.title || toSlug(cat.slug)} – Category`,
    description: cat.description || `${cat.title || toSlug(cat.slug)} に属する記事一覧`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const data = await client.fetch<CategoryPageData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug });
  if (!data?.category) notFound();

  const { category, posts = [] } = data!;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 ring-1 ring-gray-100">
        <h1 className="text-2xl font-bold tracking-tight">{category!.title || toSlug(category!.slug)}</h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{posts.length} 件</p>
      </section>

      {!posts.length && <p>このカテゴリーにはまだ記事がありません。</p>}

      <ul className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} showExcerpt showCategories />
        ))}
      </ul>
    </main>
  );
}
