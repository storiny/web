/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as path from "node:path";

import { NextConfig } from "next";
import { fileURLToPath as file_url_to_path } from "url";

const __dirname = path.dirname(file_url_to_path(import.meta.url));

const next_config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "../ui/src/theme")]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@storiny/ui"]
};

export default next_config;
