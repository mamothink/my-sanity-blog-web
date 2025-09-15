// app/[slug]/page.tsx
import Link from "next/link"
import { client } from "@/lib/sanity.client"
import { POST_BY_SLUG_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"

type Params = { slug: string }

type Post = {
  _id: string
  title: string
  slug: string | { current: string }
  mainImage?: any
  body?: any
  publishedAt?: string
  excerpt?: string
  author?: { _id: string; name?: string; slug?: any }
  categories?: { _id: string; title: string; slug: string | { current: string } }[]
}

export const revalidate = 60

export default async function PostPage({ params }: { params: Params }) {
  const post: Post | null = await client.fetch(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  })

  if (!post) {
    return <div>記事が見つかりません。</div>
  }

  const postSlug =
    typeof post.slug === "string" ? post.slug : post.slug?.current ?? ""

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article>
        {/* サムネイル */}
        {post.mainImage && (
          <img
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title}
            className="mb-6 rounded-xl"
          />
        )}

        {/* タイトル */}
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

        {/* 日付と著者 */}
        <div className="text-sm text-gray-500 mb-4">
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

        {/* 本文（PortableText などで表示しているなら置き換え） */}
        {post.body && (
          <div className="prose prose-lg">
            {/* ここにPortableTextコンポーネントなど */}
            {/* 例: <PortableText value={post.body} /> */}
          </div>
        )}

        {/* ★ カテゴリーリンク追加 */}
        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
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
      </article>
    </main>
  )
}
