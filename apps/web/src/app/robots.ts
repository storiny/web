import { MetadataRoute } from "next";

/**
 * robots.txt
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
  sitemap: "https://cdn.storiny.com/sitemaps/sitemap-index.xml"
});

export default robots;
