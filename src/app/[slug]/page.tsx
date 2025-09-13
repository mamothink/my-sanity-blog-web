import {client} from "@/lib/sanity.client"
import {POST_BY_SLUG_QUERY} from "@/lib/queries"
import {PortableText} from "@portabletext/react"
import {urlFor} from "@/lib/image"

type Props = { params: { slug: string } }

export const revalidate = 60

export default async function PostPage({params}: Props) {
  const post = await client.fetch(POST_BY_SLUG_QUERY, {slug: params.slug})

  if (!post) {
    return <main className="max-w-2xl mx-auto p-6">記事が見つかりませんでした。</main>
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      {post.mainImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlFor(post.mainImage).width(1200).height(630).url()}
          alt=""
          className="rounded-xl"
        />
      )}
      <article className="prose max-w-none">
        <PortableText value={post.body || []} />
      </article>
    </main>
  )
}
