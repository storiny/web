import { IncomingBlogRequest } from "@storiny/shared";
import { z } from "zod";

export type BlogRequestsSchema = z.infer<typeof BLOG_REQUESTS_SCHEMA>;

export const BLOG_REQUESTS_SCHEMA = z.object({
  blog_requests: z.enum([
    `${IncomingBlogRequest.EVERYONE}`,
    `${IncomingBlogRequest.FOLLOWING}`,
    `${IncomingBlogRequest.FRIENDS}`,
    `${IncomingBlogRequest.NONE}`
  ])
});
