import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type LoginSchema = z.infer<typeof LOGIN_SCHEMA>;

export const LOGIN_SCHEMA = z.object({
  email: USER_SCHEMA.email,
  password: USER_SCHEMA.password,
  remember_me: z.boolean()
});
