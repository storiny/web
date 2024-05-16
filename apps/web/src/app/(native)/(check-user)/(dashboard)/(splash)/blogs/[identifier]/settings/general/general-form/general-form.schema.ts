import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type BlogGeneralSchema = z.infer<typeof BLOG_GENERAL_SCHEMA>;

export const BLOG_GENERAL_SCHEMA = z.object({
  name: BLOG_SCHEMA.name,
  category: BLOG_SCHEMA.category,
  description: BLOG_SCHEMA.description
});
