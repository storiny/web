import { MetadataRoute } from "next";

/**
 * Robots.txt
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: [
      "/logout$",
      "/profile$",
      "/handler$",
      "/new$",
      "/api/",
      "/doc/",
      "/me/",
      "/auth/reset-password$",
      "/auth/reset-password/",
      "/auth/verify-email$",
      "/auth/verify-email/",
      "/gateway-error$"
    ]
  },
  sitemap: "https://sitemaps.storiny.com/index.xml"
});

export default robots;
