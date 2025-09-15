import Link from "next/link";
import type { Image } from "sanity";
import { client } from "@/lib/sanity.client";
import { urlFor } from "@/lib/image";
import { AUTHOR_BY_SLUG_QUERY, POSTS_BY_AUTHOR_QUERY } from "@/lib/queries";

type Author = { _id: string; name: string; picture?: Image; slug: { current: string } };
type Post = { _id: string; title: string; slug: { current: string }; mainImage?: Image; publishedAt?: string; excerpt?: string; author?: Author };

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author: Author | null = await client.fetch(AUTHOR_BY_SLUG_QUERY, { slug: params.slug });
  if (!author) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Author not found</h1>
        <p className="mt-4"><Link className="text-blue-600 underline" href="/">Back to home</Link></p>
      </main>
    );
  }

  const posts: Post[] = await client.fetch(POSTS_BY_AUTHOR_QUERY, { slug: params.slug });

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-4">
        {author.picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(author.picture).width(80).height(80).url()}
            alt={author.name}
            className="rounded-full w-16 h-16 object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{author.name}</h1>
          <p className="text-gray-600">Articles by {author.name}</p>
        </div>
      </header>

      {posts.length === 0 && <p>この著者の投稿はまだありません。</p>}

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post._id} className="border rounded-2xl p-4">
            <h2 className="text-xl font-semibold">
              <Link href={`/${post.slug.current}`}>{post.title}</Link>
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
    </main>
  );
}
