import { Blog } from "@storiny/types";

/**
 * Returns the blog's URL
 * @param domain The domain name of the blog
 * @param slug The native slug of the blog
 */
export const get_blog_url = ({
  domain,
  slug
}: Partial<Pick<Blog, "domain" | "slug">>): string =>
  `https://${domain || `${slug}.storiny.com`}`;
