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
// ページネーション用：総数 + 指定範囲の投稿（$start...$end）
export const POSTS_PAGE_QUERY = `
{
  "total": count(*[_type == "post" && !(_id in path('drafts.**'))]),
  "items": *[_type == "post" && !(_id in path('drafts.**'))]
    | order(publishedAt desc, _createdAt desc)[$start...$end]{
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
`;

export const HOMEPAGE_SIDEBAR_QUERY = /* groq */ `
{
  "ebook": *[_type == "ebook" && !(_id in path('drafts.**'))]
    | order(coalesce(orderRank, order, 0) asc, _createdAt desc)[0]{
      _id,
      title,
      description,
      body,
      "ctaLabel": coalesce(ctaLabel, buttonLabel, actionLabel, linkLabel),
      "ctaUrl": coalesce(ctaUrl, url, link, actionUrl, href),
      coverImage,
      image,
      thumbnail
    },
  "categories": *[_type == "category"]
    | order(title asc){
      _id,
      title,
      "slug": coalesce(slug.current, slug)
    },
  "popularPosts": *[_type == "post" && !(_id in path('drafts.**'))]
    | order(coalesce(popularityScore, popularity, viewCount, 0) desc, publishedAt desc, _createdAt desc)[0...5]{
      _id,
      title,
      "slug": coalesce(slug.current, slug)
    }
}
`;

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

// ====== ▼▼ ここから新規：トップページ用ページネーション ▼▼ ======

/**
 * トップ用：ページネーション付き（1回の fetch で total と items を返す）
 * $start: 0始まりの開始位置, $end: 終了位置（例: 0..8 で8件）
 */

/**
 * （必要なら）総件数だけほしい場合
 */
export const POSTS_TOTAL_COUNT_QUERY = `
  count(*[_type == "post" && !(_id in path('drafts.**'))])
`
