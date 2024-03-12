import { z } from "zod";

export type SiteNotificationsSchema = z.infer<typeof SITE_NOTIFICATIONS_SCHEMA>;

export const SITE_NOTIFICATIONS_SCHEMA = z.object({
  features_and_updates: z.boolean(),
  stories: z.boolean(),
  story_likes: z.boolean(),
  tags: z.boolean(),
  comments: z.boolean(),
  replies: z.boolean(),
  new_followers: z.boolean(),
  friend_requests: z.boolean(),
  collaboration_requests: z.boolean(),
  blog_requests: z.boolean()
});
