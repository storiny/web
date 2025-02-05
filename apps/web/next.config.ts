/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as path from "node:path";

import bundle_analyzer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { withSentryConfig as with_sentry_config } from "@sentry/nextjs";
import { polyfill } from "interweave-ssr";
import type { NextConfig } from "next";
import { fileURLToPath as file_url_to_path } from "url";

import { mdx_config } from "./mdx.config";
import { webpack_config } from "./webpack.config";

polyfill();

const __dirname = path.dirname(file_url_to_path(import.meta.url));

const with_mdx = mdx({
  options: mdx_config
});

const with_bundle_analyzer = bundle_analyzer({
  enabled: process.env.ANALYZE === "true"
});

const next_config: NextConfig = {
  trailingSlash: false,
  productionBrowserSourceMaps: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN"
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        }
      ]
    }
  ],
  rewrites: async () => [
    // Analytics
    {
      source: "/ingest/:path*",
      destination: "https://app.posthog.com/:path*"
    }
  ],
  images: {
    loader: "custom",
    loaderFile: "./img.loader.js",
    deviceSizes: [640, 860, 1024, 1440, 1920, 2048],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.storiny.com"
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "../../packages/ui/src/theme")]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: webpack_config,
  transpilePackages: ["@storiny/ui", "@storiny/editor", "@storiny/shared"],
  output: "standalone",
  experimental: {
    optimizePackageImports: [
      "@storiny/ui",
      "@storiny/editor",
      "@storiny/shared",
      "~/icons",
      "~/components",
      "~/entities"
    ]
  },
  sentry: {
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
    autoInstrumentServerFunctions: false
  }
};

export default with_sentry_config(with_bundle_analyzer(with_mdx(next_config)));
