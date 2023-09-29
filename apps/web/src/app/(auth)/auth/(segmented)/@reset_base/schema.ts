import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type ResetSchema = z.infer<typeof resetSchema>;

export const resetSchema = z.object({
  email: USER_SCHEMA.email,
  password: USER_SCHEMA.password,
  "logout-of-all-devices": z.boolean()
});
