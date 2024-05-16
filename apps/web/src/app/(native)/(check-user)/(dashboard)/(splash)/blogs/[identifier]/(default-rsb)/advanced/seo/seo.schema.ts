import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type BlogSEOSettingsSchema = z.infer<typeof BLOG_SEO_SETTINGS_SCHEMA>;

export const BLOG_SEO_SETTINGS_SCHEMA = z.object({
  seo_title: BLOG_SCHEMA.seo_title,
  seo_description: BLOG_SCHEMA.seo_description,
  preview_image: BLOG_SCHEMA.preview_image
});
