/**
 * Parses the width from the URL path segment
 * @example w@64 => 64
 * @param segment The segment with the width parameter
 */
export const get_width = (segment = ""): string => segment.substring(2);
