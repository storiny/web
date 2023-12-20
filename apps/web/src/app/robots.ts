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
      "/search/",
      "/user/",
      "/logout$",
      "/scripts/",
      "/static/",
      "/vendor/",
      "/api/",
      "/doc/",
      "/profile$",
      "/new$",
      "/handler$",
      "/*/stories",
      "/*/friends",
      "/*/followers",
      "/*/following",
      "/*/*/revisions/*",
      "/*/*/comments/*"
    ]
  },
  sitemap: "https://sitemaps.storiny.com/index.xml"
});

export default robots;
