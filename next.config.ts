import type { NextConfig } from "next";
import { storyRedirects } from "./lib/db.mjs";

const nextConfig: NextConfig = {
  async redirects() {
    return storyRedirects();
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
