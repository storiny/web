/**
 * Decodes a hex encoded remote image URL
 * @param encoded The hex encoded URL
 */
export const decode_hex = (encoded: string): string | null => {
  let i: number;
  let j: number;
  let ref: number;

  if (
    encoded &&
    encoded.length &&
    encoded.length % 2 === 0 &&
    !encoded.match(/[^\da-f]/)
  ) {
    const buffer = Buffer.alloc(encoded.length / 2);

    for (i = j = 0, ref = encoded.length; j < ref; i = j += 2) {
      buffer[i / 2] = Number.parseInt(
        encoded.slice(i, +(i + 1) + 1 || 9e9),
        16
      );
    }

    return buffer.toString();
  }

  return null;
};
