import {groq} from 'next-sanity'

// 下書きを除外するための共通フィルタ（CDN使用時のバグ回避）
const notDraft = "!(_id in path('drafts.**'))"

export const POSTS_QUERY = groq`
  *[_type == "post" && ${notDraft}] | order(publishedAt desc, _createdAt desc)[0...10]{
    _id,
    title,
    // slug はオブジェクトのまま返します（UI で post.slug.current を使う前提）
    slug,
    mainImage,
    publishedAt,
    excerpt
  }
`

export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug && ${notDraft}][0]{
    _id,
    title,
    slug,
    mainImage,
    body,
    publishedAt,
    excerpt
  }
`
