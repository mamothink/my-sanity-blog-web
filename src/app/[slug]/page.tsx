import { client } from "@/lib/sanity.client";
import { urlFor } from "@/lib/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { POST_BY_SLUG_QUERY } from "@/lib/queries";
import type { Image } from "sanity";
import type { PortableTextBlock } from "@portabletext/types";

type Author = {
  _id: string;
  name: string;
  picture?: Image;
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
};

export default async function Page({ params }: { params: { slug: string } }) {
  const post: Post | null = await client.fetch(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  });

  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      {post.mainImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlFor(post.mainImage).width(800).height(450).url()}
          alt=""
          className="rounded-xl"
        />
      )}

      <h1 className="text-3xl font-bold">{post.title}</h1>

      {post.publishedAt && (
        <p className="text-sm text-gray-500">
          {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
        </p>
      )}

      {post.author?.name && (
        <p className="text-sm text-gray-600">Author: {post.author.name}</p>
      )}

      <PortableText value={post.body ?? []} />
    </main>
  );
}
