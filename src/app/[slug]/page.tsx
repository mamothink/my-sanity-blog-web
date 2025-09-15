// src/app/[slug]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { client } from "@/lib/sanity.client"
import { POST_BY_SLUG_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"

export const revalidate = 60

// ===== 型定義（any なし） =====
type Slug = string | { current: string }

type SanityImage = {
  _type: "image"
  asset: {
    _type: "reference"
    _ref: string
  }
}

type AuthorRef = {
  _id: string
  name?: string
  slug?: Slug
  picture?: SanityImage
}

type CategoryRef = {
  _id: string
  title: string
  slug: Slug
}

type Post = {
  _id: string
  title: string
  slug: Slug
  mainImage?: SanityImage
  publishedAt?: string
  excerpt?: string
  body?: unknown // PortableText を使うなら PortableTextBlock[] などに変更可
  author?: AuthorRef
  categories?: CategoryRef[]
}

type Params = { slug: string }

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
        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

        {/* 日付と著者 */}
        <div className="mb-4 text-sm text-gray-500">
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

        {/* 抜粋（本文を描画しているなら差し替え） */}
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

        {/* 記事スラッグ（デバッグ用に一時的に表示したい場合）
        <pre className="mt-4 text-xs text-gray-400">{postSlug}</pre> */}
      </article>
    </main>
  )
}
