import Link from "next/link";
import NextImage from "next/image"; // ← 名前衝突を避けるため alias
import type { Image as SanityImage } from "sanity";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { client } from "@/lib/sanity.client";
import { urlFor } from "@/lib/image";
import { AUTHOR_BY_SLUG_QUERY, POSTS_BY_AUTHOR_QUERY } from "@/lib/queries";

type SanityImageWithAlt = SanityImage & { alt?: string };

type Author = {
  _id: string;
  name: string;
  slug: { current: string };
  picture?: SanityImageWithAlt;
  bio?: PortableTextBlock[];
};

type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: SanityImage;
  publishedAt?: string;
  excerpt?: string;
  author?: Author;
};

export const revalidate = 60;

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const author: Author | null = await client.fetch(AUTHOR_BY_SLUG_QUERY, { slug });
  if (!author) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Author not found</h1>
        <p className="mt-4">
          <Link className="text-blue-600 underline" href="/">Back to home</Link>
        </p>
      </main>
    );
  }

  const posts: Post[] = await client.fetch(POSTS_BY_AUTHOR_QUERY, { slug });

  const pictureUrl = author.picture
    ? urlFor(author.picture).width(160).height(160).fit("crop").url()
    : null;
  const pictureAlt = author.picture?.alt || `${author.name} portrait`;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header className="flex items-center gap-4">
        {pictureUrl && (
          <NextImage
            src={pictureUrl}
            alt={pictureAlt}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
            priority
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{author.name}</h1>
          <p className="text-gray-600">Articles by {author.name}</p>
        </div>
      </header>

      {/* Bio */}
      {author.bio?.length ? (
        <div className="prose max-w-none">
          <PortableText value={author.bio} />
        </div>
      ) : (
        <p className="text-gray-500">この著者のプロフィールは準備中です。</p>
      )}

      {/* 投稿一覧 */}
      {posts.length === 0 ? (
        <p className="text-gray-600">この著者の投稿はまだありません。</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post._id} className="rounded-2xl border p-4">
              <h2 className="text-xl font-semibold">
                <Link href={`/${post.slug.current}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {post.publishedAt && (
                <p className="text-sm text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                </p>
              )}
              {post.excerpt && <p className="mt-2 text-gray-700">{post.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
