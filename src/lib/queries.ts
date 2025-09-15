// src/lib/queries.ts
// ここでは groq を使いません（文字列でOK）

/**
 * トップ/一覧用：投稿に categories を含めて取得
 * 変更点:
 *  - 並び: coalesce(publishedAt, _createdAt) を使用
 *  - slug 形状の統一: "slug": slug.current
 *  - author / category の slug も "slug": slug.current に統一
 */
export const POSTS_QUERY = `
  *[_type == "post" && !(_id in path('drafts.**'))]
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...10]{
      _id,
      title,
      "slug": slug.current,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, "slug": slug.current },
      categories[]->{ _id, title, "slug": slug.current }
    }
`

/**
 * 記事詳細用：本文と categories を含めて取得
 * 変更点:
 *  - slug 形状の統一
 *  - author / category の slug も統一
 */
export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    body,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, "slug": slug.current },
    categories[]->{ _id, title, "slug": slug.current }
  }
`

/**
 * 著者ページ用
 * 変更点:
 *  - slug 形状の統一
 */
export const AUTHOR_BY_SLUG_QUERY = `
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    picture{ ..., alt },
    bio
  }
`

/**
 * 著者の投稿一覧
 * 変更点:
 *  - 並び: coalesce を使用
 *  - slug 形状の統一
 */
export const POSTS_BY_AUTHOR_QUERY = `
  *[_type == "post" && author->slug.current == $slug && !(_id in path('drafts.**'))]
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...20]{
      _id,
      title,
      "slug": slug.current,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, "slug": slug.current },
      categories[]->{ _id, title, "slug": slug.current }
    }
`

// ===== カテゴリー関連 =====

// 静的生成用：すべてのカテゴリースラッグ（既存のままでOK）
export const ALL_CATEGORY_SLUGS_QUERY = `
  *[_type == "category" && defined(slug.current)]{
    "slug": slug.current
  }
`

/**
 * カテゴリー情報 + そのカテゴリーに属する記事一覧（^を使わない安全版）
 * 変更点:
 *  - 並び: coalesce を使用
 *  - slug 形状の統一
 */
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
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc){
      _id,
      title,
      "slug": slug.current,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      author->{ _id, name, picture, "slug": slug.current },
      categories[]->{ _id, title, "slug": slug.current }
    }
  }
`

/**
 * 記事だけ欲しい版
 * 変更点:
 *  - 並び: coalesce を使用
 *  - slug 形状の統一
 */
export const POSTS_BY_CATEGORY_SLUG_QUERY = `
  *[
    _type == "post" &&
    !(_id in path('drafts.**')) &&
    count(categories[@->slug.current == $slug]) > 0
  ]
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc){
    _id,
    title,
    "slug": slug.current,
    mainImage,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, "slug": slug.current },
    categories[]->{ _id, title, "slug": slug.current }
  }
`

/**
 * 記事詳細＋関連記事（同じカテゴリの記事を3件まで）
 * 変更点:
 *  - slug 形状の統一
 *  - related の並びも coalesce を使用
 */
export const POST_WITH_RELATED_QUERY = `
  *[_type == "post" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    body,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, "slug": slug.current },
    categories[]->{ _id, title, "slug": slug.current },
    "related": *[
      _type == "post" &&
      !(_id in path('drafts.**')) &&
      count(categories[@._ref in ^.categories[]._ref]) > 0 &&
      _id != ^._id
    ] | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...3]{
      _id,
      title,
      "slug": slug.current,
      mainImage,
      "publishedAt": coalesce(publishedAt, _createdAt),
      excerpt,
      categories[]->{ _id, title, "slug": slug.current }
    }
  }
`

/**
 * 関連記事（同じカテゴリー／現在の記事を除外）
 * 変更点:
 *  - 並び: coalesce を使用
 *  - slug 形状の統一
 */
export const RELATED_POSTS_QUERY = `
  *[
    _type == "post" &&
    !(_id in path('drafts.**')) &&
    count(categories[@._ref in $categoryIds]) > 0 &&
    _id != $currentPostId
  ]
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...4]{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    "publishedAt": coalesce(publishedAt, _createdAt),
    excerpt,
    author->{ _id, name, picture, "slug": slug.current },
    categories[]->{ _id, title, "slug": slug.current }
  }
`
