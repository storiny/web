import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type BlogDomainSettingsSchema = z.infer<
  typeof BLOG_DOMAIN_SETTINGS_SCHEMA
>;

export const BLOG_DOMAIN_SETTINGS_SCHEMA = z.object({
  slug: BLOG_SCHEMA.slug
});
