import imageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";
import { client, sanityConfig } from "./sanity.client";

const builder = sanityConfig.isConfigured ? imageUrlBuilder(client) : null;

export function urlFor(source: Image) {
  if (!builder) {
    throw new Error("Sanity image builder is not configured");
  }
  return builder.image(source);
}
