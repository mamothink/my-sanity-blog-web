import { groq } from "next-sanity";

const notDraft = "!(_id in path('drafts.**'))";

export const POSTS_QUERY = groq`
  *[_type == "post" && ${notDraft}] | order(publishedAt desc, _createdAt desc)[0...10]{
    _id,
    title,
    slug,
    mainImage,
    publishedAt,
    excerpt,
    author->{ _id, name, picture }
  }
`;

export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug && ${notDraft}][0]{
    _id,
    title,
    slug,
    mainImage,
    body,
    publishedAt,
    excerpt,
    author->{ _id, name, picture }
  }
`;
