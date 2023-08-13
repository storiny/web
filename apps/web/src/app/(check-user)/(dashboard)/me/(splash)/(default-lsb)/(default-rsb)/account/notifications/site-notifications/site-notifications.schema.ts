import { z } from "zod";

export type SiteNotificationsSchema = z.infer<typeof siteNotificationsSchema>;

export const siteNotificationsSchema = z.object({
  "features-and-updates": z.boolean(),
  stories: z.boolean(),
  tags: z.boolean(),
  comments: z.boolean(),
  replies: z.boolean(),
  "new-followers": z.boolean(),
  "friend-requests": z.boolean()
});
