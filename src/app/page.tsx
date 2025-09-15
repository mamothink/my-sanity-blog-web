import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity.client";
import { POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

export const revalidate = 60;

// 型
type Slug = string | { current: string };
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } };
type AuthorRef = { _id: string; name?: string; slug?: Slug };
type CategoryRef = { _id: string; title: string; slug: Slug };

type Post = {
  _id: string;
  title: string;
  slug: Slug;
  mainImage?: SanityImage;
  publishedAt?: string;
  excerpt?: string;
  author?: AuthorRef;
  categories?: CategoryRef[];
};

export default async function HomePage() {
  const posts = await client.fetch<Post[]>(POSTS_QUERY);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Blog</h1>
        <p className="mt-2 text-sm text-gray-600">最近の投稿</p>
      </header>

      {!posts?.length && <p>まだ記事がありません。</p>}

      <ul className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => {
          const postSlug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";
          return (
            <li
              key={post._id}
              className="group overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg"
            >
              {/* 画像 */}
              {post.mainImage && (
                <Link href={`/${postSlug}`} className="block overflow-hidden">
                  <Image
                    src={urlFor(post.mainImage).width(1200).height(630).url()}
                    alt={post.title}
                    width={1200}
                    height={630}
                    className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    priority
                  />
                </Link>
              )}

              <div className="p-5">
                {/* カテゴリーバッジ */}
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

                {/* タイトル */}
                <h2 className="text-xl font-semibold leading-snug">
                  <Link href={`/${postSlug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                {/* メタ */}
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

                {/* 抜粋 */}
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
