import Link from "next/link"
import { notFound } from "next/navigation"
import { client } from "@/lib/sanity.client"
import { POST_WITH_RELATED_QUERY } from "@/lib/queries"
import { urlFor } from "@/lib/image"
import type { Metadata } from "next"

export const revalidate = 60

// 型
type Slug = string | { current: string }
type SanityImage = { _type: "image"; asset: { _type: "reference"; _ref: string } }
type CategoryRef = { _id: string; title: string; slug: Slug }
type Post = {
  _id: string
  title: string
  slug: Slug
  mainImage?: SanityImage
  publishedAt?: string
  excerpt?: string
  body?: unknown
  categories?: CategoryRef[]
  related?: {
    _id: string
    title: string
    slug: Slug
    mainImage?: SanityImage
    publishedAt?: string
    excerpt?: string
    categories?: CategoryRef[]
  }[]
}

type Params = { slug: string }

// --- OGP ---
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await client.fetch<Post | null>(POST_WITH_RELATED_QUERY, { slug: params.slug })
  if (!post) return { title: "記事が見つかりません" }

  const slug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? ""
  const ogImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "https://your-site.com/default-og.png"

  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} の記事詳細`,
    openGraph: { title: post.title, description: post.excerpt ?? "", url: `https://your-site.com/${slug}`, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt ?? "", images: [ogImage] },
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const post = await client.fetch<Post | null>(POST_WITH_RELATED_QUERY, { slug: params.slug })
  if (!post) return notFound()

  const postSlug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? ""

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article>
        {post.mainImage && (
          <img
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title ?? ""}
            className="mb-6 rounded-xl"
          />
        )}

        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

        <div className="mb-4 text-sm text-gray-500">
          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("ja-JP")}
        </div>

        {post.excerpt && <p className="mb-6">{post.excerpt}</p>}

        {post.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((c) => {
              const cSlug = typeof c.slug === "string" ? c.slug : c.slug?.current ?? ""
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

      {/* === 関連記事 === */}
      {post.related && post.related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">関連記事</h2>
          <ul className="space-y-4">
            {post.related.map((r) => {
              const rSlug = typeof r.slug === "string" ? r.slug : r.slug?.current ?? ""
              return (
                <li key={r._id} className="border rounded-lg p-4 hover:shadow-sm transition">
                  <Link href={`/${rSlug}`} className="text-lg font-medium hover:underline">
                    {r.title}
                  </Link>
                  {r.publishedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(r.publishedAt).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {r.excerpt && <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.excerpt}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
