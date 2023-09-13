import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
