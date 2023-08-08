import bundleAnalyzer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { customAlphabet } from "nanoid";
import * as path from "path";
import { fileURLToPath } from "url";

import { mdxConfig } from "./mdx.config.mjs";
import * as pkg from "./package.json" assert { type: "json" };
import { webpackConfig } from "./webpack.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nanoid = customAlphabet("1234567890abcdef", 6);

const withMDX = mdx({
  options: mdxConfig
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    includePaths: [path.join(__dirname, "../../packages/ui/src/theme")],
    additionalData: `$cdn: "${process.env.NEXT_PUBLIC_CDN_URL}";`
  },
  publicRuntimeConfig: {
    version: pkg?.default?.version,
    buildHash: nanoid()
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@storiny/ui"],
  webpack: webpackConfig
};

export default withBundleAnalyzer(withMDX(nextConfig));
