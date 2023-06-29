"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bundle_analyzer_1 = require("@next/bundle-analyzer");
// import { webpack } from "./webpack.config";
var nextConfig = {
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
    // webpack,
};
exports.default = (0, bundle_analyzer_1.default)({ enabled: process.env.ANALYZE === "true" })(nextConfig);
