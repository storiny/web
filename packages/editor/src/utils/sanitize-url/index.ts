const SUPPORTED_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

// Source: https://stackoverflow.com/a/8234912/2013580
const URL_REGEX = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
);

/**
 * Sanitizes an input URL
 * @param url URL
 */
export const sanitize_url = (url: string): string => {
  try {
    const parsed_url = new URL(url);

    if (
      !SUPPORTED_URL_PROTOCOLS.has(parsed_url.protocol) ||
      !parsed_url.pathname
    ) {
      return "about:blank";
    }
  } catch {
    return url;
  }

  return url;
};

/**
 * Validates a URL
 * @param url URL
 */
export const validate_url = (url: string): boolean =>
  url === "/" || URL_REGEX.test(url);
