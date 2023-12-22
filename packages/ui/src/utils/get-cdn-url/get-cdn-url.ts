import { ImageSize } from "@storiny/shared";

/**
 * Generates CDN url for a given media key (only for `uploads` bucket)
 * @param key CDN media key
 * @param size Size of the asset
 */
export const get_cdn_url = (
  key: string | null = "",
  size?: ImageSize
): string =>
  `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/w@${size || "auto"}/${key || ""}`;
