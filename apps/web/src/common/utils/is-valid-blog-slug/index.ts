import { BLOG_PROPS } from "@storiny/shared";

/**
 * Predicate function for validating blog slugs
 * @param slug Blog slug
 */
export const is_valid_blog_slug = (slug = ""): boolean =>
  !(
    slug.length < BLOG_PROPS.slug.min_length ||
    slug.length > BLOG_PROPS.slug.max_length
  );
