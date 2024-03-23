import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type CreateBlogSchema = z.infer<typeof CREATE_BLOG_SCHEMA>;

export const CREATE_BLOG_SCHEMA = z.object({
  name: BLOG_SCHEMA.name,
  slug: BLOG_SCHEMA.slug
});
