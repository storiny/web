import { sanitizeUrl } from "@braintree/sanitize-url";

/**
 * Sanitizes a link
 * @param link Link URL
 */
export const normalizeLink = (link: string): string => sanitizeUrl(link);

/**
 * Predicate function for checking local links
 * @param link Link URL
 */
export const isLocalLink = (link: string | null): boolean =>
  Boolean(link?.includes(location.origin) || link?.startsWith("/"));
