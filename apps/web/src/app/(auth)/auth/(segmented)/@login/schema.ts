import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type LoginSchema = z.infer<typeof loginSchema>;

export const loginSchema = z.object({
  email: USER_SCHEMA.email,
  password: USER_SCHEMA.password,
  "remember-me": z.boolean()
});
