// app/category/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/lib/sanity.client'
import { ALL_CATEGORY_SLUGS_QUERY, CATEGORY_WITH_POSTS_QUERY } from '@/lib/queries'

// ISR：Sanity更新から最長60秒で反映
export const revalidate = 60

type Params = { slug: string }

type CategoryData = {
  category?: {
    _id: string
    title: string
    description?: string
    slug: string
  }
  posts?: {
    _id: string
    title: string
    slug: string | { current: string }
    mainImage?: any
    publishedAt?: string
    excerpt?: string
    author?: { _id: string; name?: string; picture?: any; slug?: any }
    categories?: { _id: string; title: string; slug: any }[]
  }[]
} | null

// 静的生成用のパス
export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(ALL_CATEGORY_SLUGS_QUERY)
  return slugs.map(({ slug }) => ({ slug }))
}

// SEO用メタデータ
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await client.fetch<CategoryData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug })
  if (!data?.category) return { title: 'Category not found' }
  return {
    title: `${data.category.title} – Category`,
    description: data.category.description || `${data.category.title} に属する記事一覧`,
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const data = await client.fetch<CategoryData>(CATEGORY_WITH_POSTS_QUERY, { slug: params.slug })

  if (!data?.category) notFound()

  const { category, posts } = data!

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{category?.title}</h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-600">{category.description}</p>
        )}
      </header>

      {!posts?.length && <p>このカテゴリーにはまだ記事がありません。</p>}

      <ul className="space-y-6">
        {posts?.map((post) => {
          const postSlug =
            typeof post.slug === 'string'
              ? post.slug
              : (post.slug as any)?.current ?? ''

          return (
            <li key={post._id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">
                <Link href={`/post/${postSlug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              {post.publishedAt && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                </p>
              )}

              {post.excerpt && <p className="mt-2 text-gray-700">{post.excerpt}</p>}

              {post.categories?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.categories.map((c) => {
                    const cSlug =
                      typeof c.slug === 'string'
                        ? c.slug
                        : (c.slug as any)?.current ?? ''
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
            </li>
          )
        })}
      </ul>
    </main>
  )
}
