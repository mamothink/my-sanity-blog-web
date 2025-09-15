// app/page.tsx
import Link from "next/link"
import { client } from "@/lib/sanity.client"
import { POSTS_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"

type Post = {
  _id: string
  title: string
  slug: string | { current: string }
  mainImage?: any
  publishedAt?: string
  excerpt?: string
  author?: { _id: string; name?: string; slug?: any }
  categories?: { _id: string; title: string; slug: string | { current: string } }[]
}

export const revalidate = 60

export default async function HomePage() {
  const posts: Post[] = await client.fetch(POSTS_QUERY)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Blog</h1>

      {!posts?.length && <p>まだ記事がありません。</p>}

      <ul className="space-y-8">
        {posts.map((post) => {
          const postSlug =
            typeof post.slug === "string" ? post.slug : post.slug?.current ?? ""

          return (
            <li key={post._id} className="rounded-2xl border p-5">
              {/* 画像（任意） */}
              {post.mainImage && (
                // Image を使っていないなら通常の img でもOK
                <img
                  src={urlFor(post.mainImage).width(1200).url()}
                  alt={post.title}
                  className="mb-4 rounded-xl"
                />
              )}

              <h2 className="text-2xl font-semibold">
                {/* あなたの詳細ページのルートに合わせて（/post/[slug] なら `/post/${postSlug}`） */}
                <Link href={`/${postSlug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              {/* 著者・日付（任意） */}
              <div className="mt-1 text-sm text-gray-500">
                {post.publishedAt &&
                  new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                {post.author?.name && (
                  <>
                    {" "}
                    · by{" "}
                    <Link
                      href={`/author/${typeof post.author.slug === "string"
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

              {/* 抜粋（任意） */}
              {post.excerpt && (
                <p className="mt-3 text-gray-700">{post.excerpt}</p>
              )}

              {/* ★ カテゴリーをリンク化（/category/[slug] へ） */}
              {post.categories?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.categories.map((c) => {
                    const cSlug =
                      typeof c.slug === "string" ? c.slug : c.slug?.current ?? ""
                    return (
                      <Link
                        key={c._id}
                        href={`/category/${cSlug}`}
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-gray-100"
                      >
                        {c.title}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
