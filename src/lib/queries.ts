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
    author->{ _id, name, picture, slug }
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
    author->{ _id, name, picture, slug }
  }
`;

export const AUTHOR_BY_SLUG_QUERY = groq`
  *[_type == "author" && slug.current == $slug][0]{
    _id, name, picture, slug
  }
`;

export const POSTS_BY_AUTHOR_QUERY = groq`
  *[_type == "post" && author->slug.current == $slug && ${notDraft}]
    | order(publishedAt desc, _createdAt desc)[0...20]{
      _id, title, slug, mainImage, publishedAt, excerpt,
      author->{ _id, name, picture, slug }
    }
`;
