// Regex source: https://github.com/jaywcjlove/hsl-matcher/blob/main/src/index.ts

const HSLA_COMMA_MATCHER =
  /hsla?\(\s*(\+?-?\d*\.?\d*(?:e\+)?(?:\d*)?(?:deg|rad|grad|turn)?)\s*,\s*(\+?\-?\d*\.?\d*(?:e\+)?(?:\d*)?%)\s*,\s*(\+?\-?\d*\.?\d*(?:e\+)?(?:\d*)?%)\s*(,\s*\+?\-?\s*(?:\d*\.?\d*(?:E-\d*)?%?)?)?\s*\)/i;

const HSLA_SPACE_MATCHER =
  /hsla?\(\s*(\+?-?\d*\.?\d*(?:e\+)?(?:\d*)?(?:deg|rad|grad|turn)?)\s*(\+?\-?\d*\.?\d*(?:e\+)?(?:\d*)?%)\s*(\+?\-?\d*\.?\d*(?:e\+)?(?:\d*)?%)\s*(\/\s*\+?\-?\s*(?:\d*\.?\d*(?:E-\d*)?%?)?)?\s*\)/i;

/**
 * Predicate function for determining HSL(A) color strings
 * @param value Color value
 */
export const is_hsla_color = (value: string): boolean => {
  const match =
    HSLA_COMMA_MATCHER.exec(value) || HSLA_SPACE_MATCHER.exec(value);

  if (match) {
    const [, , , , a] = match;
    return !(a && /^(:?(\/|,)\s*-?\+?)$/.test(a.trim()));
  }

  return false;
};
