import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type EmailSettingsSchema = z.infer<typeof EMAIL_SETTINGS_SCHEMA>;

export const EMAIL_SETTINGS_SCHEMA = z.object({
  new_email: USER_SCHEMA.email,
  current_password: USER_SCHEMA.password
});
