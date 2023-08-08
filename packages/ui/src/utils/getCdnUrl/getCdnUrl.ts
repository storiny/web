import { ImageSize } from "@storiny/shared";

/**
 * Generates CDN url for a given media key
 * @param key The CDN media key
 * @param size The size of the asset
 */
export const getCdnUrl = (key: string | null = "", size?: ImageSize): string =>
  `${process.env.NEXT_PUBLIC_CDN_URL}/w@${size || "auto"}/uploads/${key || ""}`;
