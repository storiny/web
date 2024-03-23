// These values need to be hardcoded here as dynamic code evaluation is not
// supported in the `middleware.ts`.
const MIN_LENGTH = 3;
const MAX_LENGTH = 24;

/**
 * Predicate function for validating blog slugs
 * @param slug Blog slug
 */
export const is_valid_blog_slug = (slug = ""): boolean =>
  slug.length > MIN_LENGTH && slug.length < MAX_LENGTH;
