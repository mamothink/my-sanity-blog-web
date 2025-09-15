import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { client } from "@/lib/sanity.client"
import { POST_BY_SLUG_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"

// ===== 型定義 =====
type SanityImage = {
  _type: "image"
  asset: {
    _ref: string
    _type: "reference"
  }
}

type Post = {
  _id: string
  title: string
  slug: string | { current: string }
  mainImage?: SanityImage
  publishedAt?: string
  excerpt?: string
  body?: any // PortableText の型を入れたい場合は @portabletext/types を使う
  author?: {
    _id: string
    name?: string
    picture?: SanityImage
    slug?: { current: string }
  }
  categories?: { _id: string; title: string; slug: { current: string } }[]
}

type Params = { slug: string }

// ISR（更新から最長60秒で反映）
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  })
  if (!post) return { title: "記事が見つかりません" }
  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} の記事詳細`,
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  })
  if (!post) return notFound()

  const postSlug =
    typeof post.slug === "string" ? post.slug : post.slug?.current ?? ""

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article>
        {/* サムネイル */}
        {post.mainImage && (
          <img
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title ?? ""}
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
                href={`/author/${
                  typeof post.author.slug === "string"
                    ? post.author.slug
                    : post.author.slug?.current ?? ""
                }`}
                className="hover:underline"
              >
                {post.author.name}
              </Link>
            </>
          )}
        </div>

        {/* 本文 */}
        {post.excerpt && <p className="mb-6">{post.excerpt}</p>}

        {/* カテゴリーリンク */}
        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((c) => {
              const cSlug =
                typeof c.slug === "string" ? c.slug : c.slug?.current ?? ""
              return (
                <Link
                  key={c._id}
                  href={`/category/${cSlug}`}
                  className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
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
