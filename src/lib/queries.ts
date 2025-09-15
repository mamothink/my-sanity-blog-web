import { groq } from "next-sanity";

const notDraft = "!(_id in path('drafts.**'))";

/**
 * トップ/一覧用：投稿に categories を含めて取得
 */
export const POSTS_QUERY = groq`
  *[_type == "post" && ${notDraft}] 
    | order(publishedAt desc, _createdAt desc)[0...10]{
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt,
      author->{ _id, name, picture, slug },
      categories[]->{ _id, title, slug }  // ★追加
    }
`;

/**
 * 記事詳細用：本文と categories を含めて取得
 */
export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug && ${notDraft}][0]{
    _id,
    title,
    slug,
    mainImage,
    body,
    publishedAt,
    excerpt,
    author->{ _id, name, picture, slug },
    categories[]->{ _id, title, slug }    // ★追加
  }
`;

/**
 * 著者ページ用
 */
export const AUTHOR_BY_SLUG_QUERY = groq`
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    picture{ ..., alt },
    bio
  }
`;

/**
 * 著者の投稿一覧（必要に応じて categories を使いたければ同様に追加可）
 */
export const POSTS_BY_AUTHOR_QUERY = groq`
  *[_type == "post" && author->slug.current == $slug && ${notDraft}]
    | order(publishedAt desc, _createdAt desc)[0...20]{
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt,
      author->{ _id, name, picture, slug }
    }
`;
