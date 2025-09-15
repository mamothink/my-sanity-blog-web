// src/app/page.tsx
import type { Image } from "sanity";
import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { POSTS_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";

type Author = {
  _id: string;
  name: string;
  picture?: Image;
  slug?: { current: string };
};

type Category = {
  _id: string;
  title: string;
  slug: { current: string };
};

type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: Image;
  publishedAt?: string;
  excerpt?: string;
  author?: Author;
  categories?: Category[]; // 👈 追加
};

export const revalidate = 60;

export default async function Page() {
  const posts: Post[] = await client.fetch(POSTS_QUERY);

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Blog</h1>

      {posts.length === 0 && <p>記事がありません</p>}

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post._id} className="border rounded-2xl p-4">
            {post.mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlFor(post.mainImage).width(800).height(450).url()}
                alt=""
                className="rounded-xl mb-3"
              />
            )}

            <h2 className="text-xl font-semibold">
              <Link href={`/${post.slug.current}`}>{post.title}</Link>
            </h2>

            {post.publishedAt && (
              <p className="text-sm text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
              </p>
            )}

            {post.author?.name && post.author.slug?.current && (
              <p className="text-sm text-gray-600">
                by{" "}
                <Link
                  href={`/author/${post.author.slug.current}`}
                  className="text-blue-600 hover:underline"
                >
                  {post.author.name}
                </Link>
              </p>
            )}

            {/* 👇 カテゴリー表示（タグ風） */}
            {post.categories?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {post.categories.map((cat) => (
                  <span
                    key={cat._id}
                    className="px-2 py-0.5 bg-gray-200 rounded-full text-xs"
                    title={cat.title}
                  >
                    {cat.title}
                  </span>
                ))}
              </div>
            ) : null}

            {post.excerpt && (
              <p className="mt-2 text-gray-700">{post.excerpt}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
