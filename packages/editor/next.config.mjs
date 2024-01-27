/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as path from "node:path";

import { fileURLToPath as file_url_to_path } from "url";

const __dirname = path.dirname(file_url_to_path(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "../ui/src/theme")]
  },
  experimental: {
    missingSuspenseWithCSRBailout: false
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@storiny/ui"]
};

export default nextConfig;
