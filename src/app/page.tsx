import Link from "next/link"
import { client } from "@/lib/sanity.client"
import { POSTS_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"
import type { Image } from "sanity"

export const revalidate = 60

type Post = {
  _id: string
  title: string
  slug: { current: string }
  mainImage?: Image
}

export default async function Page() {
  const posts: Post[] = await client.fetch(POSTS_QUERY)

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
          </li>
        ))}
      </ul>
    </main>
  )
}
