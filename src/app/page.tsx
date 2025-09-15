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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Blog</h1>

      {!posts?.length && <p>まだ記事がありません。</p>}

      <ul className="space-y-8">
        {posts.map((post) => {
          const postSlug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";
          return (
            <li key={post._id} className="rounded-2xl border p-5">
              {post.mainImage && (
                <Image
                  src={urlFor(post.mainImage).width(1200).height(630).url()}
                  alt={post.title}
                  width={1200}
                  height={630}
                  className="mb-4 rounded-xl"
                  priority
                />
              )}

              <h2 className="text-2xl font-semibold">
                <Link href={`/${postSlug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              <div className="mt-1 text-sm text-gray-500">
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

              {post.excerpt && <p className="mt-3 text-gray-700">{post.excerpt}</p>}

              {post.categories?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.categories.map((c) => {
                    const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? "";
                    return (
                      <Link
                        key={c._id}
                        href={`/category/${cSlug}`}
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-gray-100"
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
