import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type EmailSettingsSchema = z.infer<typeof emailSettingsSchema>;

export const emailSettingsSchema = z.object({
  "new-email": USER_SCHEMA.email,
  "current-password": USER_SCHEMA.password
});
