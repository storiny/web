import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type LoginSchema = z.infer<typeof loginSchema>;

export const loginSchema = z.object({
  email: userSchema.email,
  password: userSchema.password,
  "remember-me": z.boolean()
});
