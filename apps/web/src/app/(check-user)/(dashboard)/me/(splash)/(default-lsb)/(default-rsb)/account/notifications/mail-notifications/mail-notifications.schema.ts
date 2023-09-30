import { z } from "zod";

export type MailNotificationsSchema = z.infer<typeof MAIL_NOTIFICATIONS_SCHEMA>;

export const MAIL_NOTIFICATIONS_SCHEMA = z.object({
  features_and_updates: z.boolean(),
  login_activity: z.boolean(),
  newsletters: z.boolean(),
  digest: z.boolean()
});
