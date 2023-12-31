/**
 * Simple diffing algorithm with cursor
 * @param a Old text
 * @param b New text
 * @param cursor Cursor
 */
export const simple_diff_with_cursor = (
  a: string,
  b: string,
  cursor: number
): { index: number; insert: string; remove: number } => {
  const a_length = a.length;
  const b_length = b.length;
  let left = 0; // Number of same characters counting from the left
  let right = 0; // Number of same characters counting from the right

  // Iterate left to the right until we find a changed character.
  // First iteration considers the current cursor position
  while (
    left < a_length &&
    left < b_length &&
    a[left] === b[left] &&
    left < cursor
  ) {
    left++;
  }

  // Iterate right to the left until we find a changed character
  while (
    right + left < a_length &&
    right + left < b_length &&
    a[a_length - right - 1] === b[b_length - right - 1]
  ) {
    right++;
  }

  // Try to iterate left further to the right without caring about the current
  // cursor position
  while (
    right + left < a_length &&
    right + left < b_length &&
    a[left] === b[left]
  ) {
    left++;
  }

  return {
    index: left,
    insert: b.slice(left, b_length - right),
    remove: a_length - left - right
  };
};
