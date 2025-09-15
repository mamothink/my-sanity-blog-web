// src/lib/queries.ts
// ここでは groq を使いません（文字列でOK）

/**
 * トップ/一覧用：投稿に categories を含めて取得
 */
export const POSTS_QUERY = `
  *[_type == "post" && !(_id in path('drafts.**'))]
    | order(publishedAt desc, _createdAt desc)[0...10]{
      _id,
      title,
      slug,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, slug },
      categories[]->{ _id, title, slug }
    }
`

/**
 * 記事詳細用：本文と categories を含めて取得
 */
export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
    _id,
    title,
    slug,
    mainImage,
    body,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, slug },
    categories[]->{ _id, title, slug }
  }
`

/**
 * 著者ページ用
 */
export const AUTHOR_BY_SLUG_QUERY = `
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    picture{ ..., alt },
    bio
  }
`

/**
 * 著者の投稿一覧
 */
export const POSTS_BY_AUTHOR_QUERY = `
  *[_type == "post" && author->slug.current == $slug && !(_id in path('drafts.**'))]
    | order(publishedAt desc, _createdAt desc)[0...20]{
      _id,
      title,
      slug,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, slug },
      categories[]->{ _id, title, slug }
    }
`

// ===== カテゴリー関連 =====

// 静的生成用：すべてのカテゴリースラッグ
export const ALL_CATEGORY_SLUGS_QUERY = `
  *[_type == "category" && defined(slug.current)]{
    "slug": slug.current
  }
`

// カテゴリー情報 + そのカテゴリーに属する記事一覧（^を使わない安全版）
export const CATEGORY_WITH_POSTS_QUERY = `
  {
    "category": *[_type == "category" && slug.current == $slug][0]{
      _id,
      title,
      description,
      "slug": slug.current
    },
    "posts": *[
      _type == "post" &&
      !(_id in path('drafts.**')) &&
      count(categories[@->slug.current == $slug]) > 0
    ]
    | order(publishedAt desc, _createdAt desc){
      _id,
      title,
      slug,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, slug },
      categories[]->{ _id, title, slug }
    }
  }
`

// 記事だけ欲しい版
export const POSTS_BY_CATEGORY_SLUG_QUERY = `
  *[
    _type == "post" &&
    !(_id in path('drafts.**')) &&
    count(categories[@->slug.current == $slug]) > 0
  ]
  | order(publishedAt desc, _createdAt desc){
    _id,
    title,
    slug,
    mainImage,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, slug },
    categories[]->{ _id, title, slug }
  }
`

/**
 * 記事詳細＋関連記事（同じカテゴリの記事を3件まで）
 */
export const POST_WITH_RELATED_QUERY = `
  *[_type == "post" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
    _id,
    title,
    slug,
    mainImage,
    body,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, slug },
    categories[]->{ _id, title, slug },
    "related": *[
      _type == "post" &&
      !(_id in path('drafts.**')) &&
      count(categories[@._ref in ^.categories[]._ref]) > 0 &&
      _id != ^._id
    ] | order(publishedAt desc)[0...3]{
      _id,
      title,
      slug,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      categories[]->{ _id, title, slug }
    }
  }
`

/**
 * 関連記事（同じカテゴリー／現在の記事を除外）
 */
export const RELATED_POSTS_QUERY = `
  *[
    _type == "post" &&
    !(_id in path('drafts.**')) &&
    count(categories[@._ref in $categoryIds]) > 0 &&
    _id != $currentPostId
  ]
  | order(publishedAt desc, _createdAt desc)[0...4]{
    _id,
    title,
    slug,
    mainImage,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, slug },
    categories[]->{ _id, title, slug }
  }
`
