import { z } from "zod";

export type MailNotificationsSchema = z.infer<typeof mailNotificationsSchema>;

export const mailNotificationsSchema = z.object({
  "features-and-updates": z.boolean(),
  "login-activity": z.boolean(),
  newsletters: z.boolean(),
  digest: z.boolean()
});
