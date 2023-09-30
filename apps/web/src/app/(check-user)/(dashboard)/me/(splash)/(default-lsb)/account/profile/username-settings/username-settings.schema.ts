import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type UsernameSettingsSchema = z.infer<typeof USERNAME_SETTINGS_SCHEMA>;

export const USERNAME_SETTINGS_SCHEMA = z.object({
  new_username: USER_SCHEMA.username,
  current_password: USER_SCHEMA.password
});
