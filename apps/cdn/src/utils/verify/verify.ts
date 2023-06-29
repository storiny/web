import crypto from "crypto";

/**
 * Verifies the incoming remote image URL
 * @param digest The URL digest segment
 * @param decodedUrl The decoded hex image URL
 * @param key Secret used for testing
 */
export const verify = (
  digest: string,
  decodedUrl: string,
  // Allow passing key as a parameter for tests
  key?: string
): boolean => {
  try {
    const hmac = crypto.createHmac(
      "sha1",
      key || (process.env.PROXY_KEY as string)
    );
    hmac.update(decodedUrl, "utf8");

    if (hmac.digest("hex") === digest) {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
};
