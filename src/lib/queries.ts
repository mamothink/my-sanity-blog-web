import {groq} from 'next-sanity'

export const POSTS_QUERY = groq`
  *[_type == "post"] | order(_createdAt desc)[0...10]{
    _id,
    title,
    slug,
    mainImage
  }
`
export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0]{
    _id, title, slug, mainImage, body
  }
`
