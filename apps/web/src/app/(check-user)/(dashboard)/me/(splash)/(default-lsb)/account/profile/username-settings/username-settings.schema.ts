import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type UsernameSettingsSchema = z.infer<typeof usernameSettingsSchema>;

export const usernameSettingsSchema = z.object({
  "new-username": USER_SCHEMA.username,
  "current-password": USER_SCHEMA.password
});
