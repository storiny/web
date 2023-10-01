/* eslint-disable prefer-snakecase/prefer-snakecase */

import bundle_analyzer from "@next/bundle-analyzer";
import mdx from "@next/mdx";
import { polyfill } from "interweave-ssr";
import { customAlphabet as custom_alphabet } from "nanoid";
import * as path from "path";
import { fileURLToPath as file_url_to_path } from "url";

import { mdxConfig } from "./mdx.config.mjs";
import * as pkg from "./package.json" assert { type: "json" };
import { webpack_config } from "./webpack.config.mjs";

polyfill();

const __dirname = path.dirname(file_url_to_path(import.meta.url));
const nanoid = custom_alphabet("1234567890abcdef", 6);

const with_mdx = mdx({
  options: mdxConfig
});

const with_bundle_analyzer = bundle_analyzer({
  enabled: process.env.ANALYZE === "true"
});

/** @type {import('next').NextConfig} */
const next_config = {
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
  webpack: webpack_config
};

export default with_bundle_analyzer(with_mdx(next_config));
