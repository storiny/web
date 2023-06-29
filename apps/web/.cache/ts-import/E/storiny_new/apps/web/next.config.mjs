import bundleAnalyzer from "@next/bundle-analyzer";
import { webpack } from "./webpack.config";
const nextConfig = {
    experimental: {
        typedRoutes: true,
    },
    images: {
        loader: "custom",
        loaderFile: "./img.loader.js",
        deviceSizes: [640, 860, 1024, 1440, 1920, 2048],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.storiny.com",
            },
        ],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    poweredByHeader: false,
    reactStrictMode: true,
    transpilePackages: ["@storiny/ui"],
    webpack,
};
export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
