import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type BlogDeleteActionSchema = z.infer<typeof BLOG_DELETE_ACTION_SCHEMA>;

export const BLOG_DELETE_ACTION_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
