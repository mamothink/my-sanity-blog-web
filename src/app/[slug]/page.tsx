import { client } from "@/lib/sanity.client"
import { urlFor } from "@/lib/image"
import { notFound } from "next/navigation"
import { PortableText } from "@portabletext/react"
import { POST_BY_SLUG_QUERY } from "@/lib/queries"
import type { Image } from "sanity"

// PortableText 用に最低限の型を用意（any は使わない）
type PTBlock = { _type: string; [key: string]: unknown }

type Post = {
  _id: string
  title: string
  slug: { current: string }
  body?: PTBlock | PTBlock[] | null
  mainImage?: Image
}

export default async function Page({ params }: { params: { slug: string } }) {
  const post: Post | null = await client.fetch(POST_BY_SLUG_QUERY, {
    slug: params.slug,
  })

  if (!post) {
    // 未使用 Warning を避けつつ、正しく 404 へ
    notFound()
  }

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
      <PortableText value={post.body ?? []} />
    </main>
  )
}
