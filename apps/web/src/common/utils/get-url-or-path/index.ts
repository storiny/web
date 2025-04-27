/**
 * Tries to extract the target URL or pathname from the given `value`.
 * @param value The value containing the URL or pathname.
 */
export const get_url_or_path = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  // Already a path.
  if (value.startsWith("/")) {
    return value;
  }

  // Already a URL.
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  try {
    const url = new URL(`https://${value}`);
    return url.toString();
  } catch (_e) {
    return null;
  }
};
