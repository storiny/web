import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type EmailSettingsSchema = z.infer<typeof emailSettingsSchema>;

export const emailSettingsSchema = z.object({
  "new-email": userSchema.email,
  "current-password": userSchema.password
});
