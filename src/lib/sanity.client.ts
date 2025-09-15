// lib/sanity.client.ts
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, // 例: "abcd1234"
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,      // 例: "production"
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01',
  useCdn: true, // 参照クエリなので true でOK（ドラフトを見たい時は false + token）
})
