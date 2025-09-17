// src/app/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY } from "@/lib/queries";

export const revalidate = 60;

/** ルートのパラメータ（Next 15 は Promise で渡ってくる → await 必須） */
type Params = { slug: string };

/** クエリで最低限使うフィールドだけ定義（any禁止） */
type Post = {
  _id: string;
  title: string;
  slug: { current?: string } | string;
  excerpt?: string;
};

/** ▼ メタデータ：params を await してから使用 */
export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });
  if (!post) return { title: "記事が見つかりません" };
  return {
    title: post.title,
    description: post.excerpt ?? "",
  };
}

/** ▼ ページ本体：こちらも params を await。最小表示のみ。 */
export default async function PostPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });
  if (!post) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      {post.excerpt ? (
        <p className="mt-3 text-gray-700">{post.excerpt}</p>
      ) : null}
    </main>
  );
}
