import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type UsernameSettingsSchema = z.infer<typeof usernameSettingsSchema>;

export const usernameSettingsSchema = z.object({
  "new-username": userSchema.username,
  "current-password": userSchema.password
});
