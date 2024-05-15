import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type BlogSlugSettingsSchema = z.infer<typeof BLOG_SLUG_SETTINGS_SCHEMA>;

export const BLOG_SLUG_SETTINGS_SCHEMA = z.object({
  slug: BLOG_SCHEMA.slug
});
