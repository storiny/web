/**
 * Composed text diffing
 * @param a Text
 * @param b Another text
 */
export const diff_composed_text = (
  a: string,
  b: string
): [number, number, string] => {
  const a_length = a.length;
  const b_length = b.length;
  let left = 0;
  let right = 0;

  while (left < a_length && left < b_length && a[left] === b[left]) {
    left++;
  }
  while (
    right + left < a_length &&
    right + left < b_length &&
    a[a_length - right - 1] === b[b_length - right - 1]
  ) {
    right++;
  }

  return [left, a_length - left - right, b.slice(left, b_length - right)];
};
