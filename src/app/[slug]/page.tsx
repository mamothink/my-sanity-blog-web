import Link from "next/link";
import { client } from "@/lib/sanity.client";
import { urlFor } from "@/lib/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { POST_BY_SLUG_QUERY } from "@/lib/queries";
import type { Image } from "sanity";
import type { PortableTextBlock } from "@portabletext/types";

type Category = {
  _id: string;
  title: string;
  slug: { current: string };
};

type Author = {
  _id: string;
  name: string;
  picture?: Image;
  slug?: { current: string };
};

type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: Image;
  body?: PortableTextBlock[];
  publishedAt?: string;
  excerpt?: string;
  author?: Author;
  categories?: Category[];
};

export default async function Page({ params }: { params: { slug: string } }) {
  const post: Post | null = await client.fetch(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  });

  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      {/* メイン画像 */}
      {post.mainImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlFor(post.mainImage).width(800).height(450).url()}
          alt=""
          className="rounded-xl"
        />
      )}

      {/* タイトル */}
      <h1 className="text-3xl font-bold">{post.title}</h1>

      {/* 日付 */}
      {post.publishedAt && (
        <p className="text-sm text-gray-500">
          {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
        </p>
      )}

      {/* 著者リンク */}
      {post.author?.name && post.author?.slug?.current && (
        <p className="text-sm text-gray-600">
          Author:{" "}
          <Link
            className="underline text-blue-600 hover:text-blue-800"
            href={`/author/${post.author.slug.current}`}
          >
            {post.author.name}
          </Link>
        </p>
      )}

      {/* カテゴリー表示 */}
      {post.categories?.length ? (
        <div className="flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <span
              key={cat._id}
              className="px-2 py-1 bg-gray-200 rounded-full text-sm"
            >
              {cat.title}
            </span>
          ))}
        </div>
      ) : null}

      {/* 本文 */}
      <PortableText value={post.body ?? []} />
    </main>
  );
}
