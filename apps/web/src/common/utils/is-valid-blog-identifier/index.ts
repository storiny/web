import { is_snowflake } from "~/common/utils/is-snowflake";

// These values need to be hardcoded here as dynamic code evaluation is not
// supported in the `middleware.ts`.
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 24;
const DOMAIN_MIN_LENGTH = 3;
const DOMAIN_MAX_LENGTH = 512;

/**
 * Predicate function for validating blog identifiers (slug, id or custom domains).
 * @param identifier Blog identifier
 */
export const is_valid_blog_identifier = (identifier = ""): boolean =>
  is_snowflake(identifier) ||
  (identifier.includes(".")
    ? identifier.length >= DOMAIN_MIN_LENGTH &&
      identifier.length <= DOMAIN_MAX_LENGTH
    : identifier.length >= SLUG_MIN_LENGTH &&
      identifier.length <= SLUG_MAX_LENGTH);
