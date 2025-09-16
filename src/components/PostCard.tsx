"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import imageUrlBuilder from "@sanity/image-url";

/** 目的
 * - どんな形の post でも安全に描画（Record<string, unknown>）
 * - any を使わない
 * - Sanity 画像を URL 化
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v ? v : null;
}
function readDateLike(obj: Record<string, unknown>, key: string): string | Date | null {
  const v = obj[key];
  if (typeof v === "string" && v) return v;
  if (v instanceof Date) return v;
  return null;
}
function toSlugLocal(slug: unknown): string {
  if (typeof slug === "string") return slug;
  if (isRecord(slug)) {
    const cur = slug["current"];
    if (typeof cur === "string") return cur;
  }
  return "";
}
function formatDate(input?: string | Date | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

/** 画像URLビルダー最小型 */
type SanityImageSource =
  | { asset?: { _ref?: string; _id?: string } }
  | { _ref?: string }
  | { _id?: string }
  | string;
type ImageBuilderChain = {
  width: (n: number) => ImageBuilderChain;
  height: (n: number) => ImageBuilderChain;
  fit: (f: "crop" | "fill" | "max" | "min" | "scale") => ImageBuilderChain;
  url: () => string;
};
type ImageUrlBuilderLike = {
  image: (source: SanityImageSource) => ImageBuilderChain;
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "";
const builder: ImageUrlBuilderLike | null =
  projectId && dataset ? (imageUrlBuilder({ projectId, dataset }) as unknown as ImageUrlBuilderLike) : null;

function toSanityImageSource(v: unknown): SanityImageSource | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (isRecord(v)) {
    const asset = v["asset"];
    if (isRecord(asset)) {
      const ref = asset["_ref"];
      const id = asset["_id"];
      if (typeof ref === "string" || typeof id === "string") {
        return { asset: { _ref: typeof ref === "string" ? ref : undefined, _id: typeof id === "string" ? id : undefined } };
      }
    }
    const ref = v["_ref"];
    if (typeof ref === "string") return { _ref: ref };
    const id = v["_id"];
    if (typeof id === "string") return { _id: id };
  }
  return null;
}
function urlForSanityImage(src: SanityImageSource | null, width = 1200, height = 675): string | null {
  if (!builder || !src) return null;
  return builder.image(src).width(width).height(height).fit("crop").url();
}

/** props（型はゆるく） */
export type PostCardProps = {
  post: Record<string, unknown>;
  className?: string;
};

export default function PostCard({ post, className }: PostCardProps) {
  const title = isRecord(post) ? readString(post, "title") ?? "Untitled" : "Untitled";
  const href = `/${isRecord(post) ? toSlugLocal(post["slug"]) : ""}`;

  // カテゴリ
  let category: string | null = null;
  const categories = isRecord(post) ? post["categories"] : null;
  if (Array.isArray(categories)) {
    for (const c of categories) {
      if (isRecord(c)) {
        const t = readString(c, "title");
        if (t) { category = t; break; }
      }
    }
  }

  const published = isRecord(post) ? readDateLike(post, "publishedAt") : null;
  const date = formatDate(published);

  // 画像候補
  let imgSrc = "/default-og.png";
  if (isRecord(post)) {
    const s1 = urlForSanityImage(toSanityImageSource(post["mainImage"]));
    const s2 = urlForSanityImage(toSanityImageSource(post["image"]));
    const common1 = readString(post, "imageUrl");
    const common2 = readString(post, "mainImageUrl");
    imgSrc = s1 ?? s2 ?? common1 ?? common2 ?? "/default-og.png";
  }

  const excerpt = isRecord(post) ? readString(post, "excerpt") ?? "" : "";

  return (
    <article
      className={[
        "group rounded-2xl border border-gray-200/60 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        "dark:border-white/10 dark:bg-zinc-900",
        className ?? "",
      ].join(" ")}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={false}
          />
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {category ? (
            <span className="rounded-full border border-gray-200/60 px-2 py-0.5 dark:border-white/10">{category}</span>
          ) : null}
          {date ? (
            <>
              {category ? <span className="text-gray-300 dark:text-zinc-600">•</span> : null}
              <time dateTime={published ? new Date(published).toISOString() : undefined}>{date}</time>
            </>
          ) : null}
        </div>

        <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
          <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
            <span className="bg-gradient-to-r from-transparent via-transparent to-transparent bg-[length:0_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]">
              {title}
            </span>
          </Link>
        </h3>

        {excerpt ? <p className="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{excerpt}</p> : null}

        <div className="mt-1">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200/60 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            aria-label={`${title} を読む`}
          >
            続きを読む
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
