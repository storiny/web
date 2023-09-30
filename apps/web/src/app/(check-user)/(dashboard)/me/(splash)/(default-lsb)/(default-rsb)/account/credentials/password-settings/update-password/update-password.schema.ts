import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type UpdatePasswordSchema = z.infer<typeof UPDATE_PASSWORD_SCHEMA>;

export const UPDATE_PASSWORD_SCHEMA = z.object({
  current_password: USER_SCHEMA.password,
  new_password: USER_SCHEMA.password
});
