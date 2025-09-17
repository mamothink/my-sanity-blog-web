// lib/sanity.client.ts
import { createClient } from "next-sanity";

const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const rawDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";
const useCdn = true;

const isConfigured = Boolean(rawProjectId && rawDataset);

type SanityClientType = ReturnType<typeof createClient>;
type SanityClientConfig = Parameters<typeof createClient>[0];

const baseConfig: SanityClientConfig = {
  projectId: rawProjectId ?? "",
  dataset: rawDataset ?? "",
  apiVersion,
  useCdn,
};

const warnMissingConfig = (() => {
  let warned = false;
  return () => {
    if (!warned && process.env.NODE_ENV !== "production") {
      console.warn(
        "[sanity.client] Sanity 環境変数が設定されていません。NEXT_PUBLIC_SANITY_PROJECT_ID と NEXT_PUBLIC_SANITY_DATASET を設定してください。"
      );
      warned = true;
    }
  };
})();

const fallbackClient = {
  async fetch<T>(
    _query: string,
    _params?: Record<string, unknown>
  ): Promise<T> {
    warnMissingConfig();
    void _query;
    void _params;
    return [] as unknown as T;
  },
  config() {
    return baseConfig;
  },
  withConfig() {
    return this as unknown as SanityClientType;
  },
} as unknown as SanityClientType;

export const client: SanityClientType = isConfigured
  ? createClient({
      projectId: rawProjectId!,
      dataset: rawDataset!,
      apiVersion,
      useCdn,
    })
  : fallbackClient;

export const sanityConfig = {
  ...baseConfig,
  isConfigured,
};
