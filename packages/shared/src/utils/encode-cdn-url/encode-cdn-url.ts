import crypto from "crypto";

/**
 * Signs a third-party image URL with the private CAMO_KEY to serve them through the CDN,
 * preventing unsecure context warnings and providing cached versions.
 * @param url URL of the image
 * @param key Optional CAMO_KEY for testing
 */
export const encodeCdnUrl = (
  url: string,
  key?: string
): { digest: string; url: string } | null => {
  const hmac = crypto.createHmac(
    "sha1",
    key || (process.env.CAMO_KEY as string)
  );

  try {
    hmac.update(url, "utf8");
  } catch (e) {
    return null;
  }

  return { digest: hmac.digest("hex"), url: Buffer.from(url).toString("hex") };
};
