import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type ResetSchema = z.infer<typeof RESET_SCHEMA>;

export const RESET_SCHEMA = z.object({
  email: USER_SCHEMA.email,
  password: USER_SCHEMA.password,
  logout_of_all_devices: z.boolean()
});
