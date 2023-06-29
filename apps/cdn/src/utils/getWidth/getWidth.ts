/**
 * Parses the width from the URL path segment
 * @example w@64 => 64
 * @param segment The segment with the width parameter
 */
export const getWidth = (segment: string = ""): string => segment.substring(2);
