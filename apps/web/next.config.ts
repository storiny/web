/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as path from "node:path";

import bundle_analyzer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { withSentryConfig as with_sentry_config } from "@sentry/nextjs";
import crypto from "crypto";
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
  assetPrefix:
    process.env.NODE_ENV === "production" ? "https://storiny.com" : undefined,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN"
        }
      ]
    },
    {
      // Static content is served to blogs hosted on external domain.
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        }
      ]
    }
  ],
  rewrites: async () => [
    // Posthog analytics
    {
      source: "/ingest/:path*",
      destination: "https://app.posthog.com/:path*"
    }
  ],
  redirects: async () => [
    // storiny.com
    {
      source: "/legal",
      destination: "/legal/terms/tos",
      permanent: true,
      has: [{ type: "host", value: "storiny.com" }]
    },
    {
      source: "/terms",
      destination: "/legal/terms/tos",
      permanent: true,
      has: [{ type: "host", value: "storiny.com" }]
    },
    {
      source: "/privacy",
      destination: "/legal/policies/privacy",
      permanent: true,
      has: [{ type: "host", value: "storiny.com" }]
    },
    {
      source: "/guidelines",
      destination: "/legal/terms/community-guidelines",
      permanent: true,
      has: [{ type: "host", value: "storiny.com" }]
    },
    {
      source: "/cookies",
      destination:
        "/legal/policies/privacy#6-cookies-and-tracking-technologies",
      permanent: true,
      has: [{ type: "host", value: "storiny.com" }]
    },
    // localhost
    {
      source: "/legal",
      destination: "/legal/terms/tos",
      permanent: true,
      has: [{ type: "host", value: "localhost" }]
    },
    {
      source: "/terms",
      destination: "/legal/terms/tos",
      permanent: true,
      has: [{ type: "host", value: "localhost" }]
    },
    {
      source: "/privacy",
      destination: "/legal/policies/privacy",
      permanent: true,
      has: [{ type: "host", value: "localhost" }]
    },
    {
      source: "/guidelines",
      destination: "/legal/terms/community-guidelines",
      permanent: true,
      has: [{ type: "host", value: "localhost" }]
    },
    {
      source: "/cookies",
      destination:
        "/legal/policies/privacy#6-cookies-and-tracking-technologies",
      permanent: true,
      has: [{ type: "host", value: "localhost" }]
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
  generateBuildId: async () => crypto.randomUUID(),
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
      "@visx/visx",
      "@storiny/ui",
      "@storiny/editor",
      "@storiny/shared",
      "~/icons",
      "~/components",
      "~/entities"
    ]
  }
};

export default with_sentry_config(with_bundle_analyzer(with_mdx(next_config)), {
  org: "storiny",
  project: "website",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/api/monitor",
  telemetry: false,
  disableLogger: true,
  autoInstrumentServerFunctions: false,
  // TODO: Source maps are currently disabled due to
  // `deleteSourcemapsAfterUpload` not working properly.
  sourcemaps: { disable: true, deleteSourcemapsAfterUpload: true },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true
  }
});
