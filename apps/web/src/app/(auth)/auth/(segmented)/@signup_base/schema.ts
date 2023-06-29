import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type SignupBaseSchema = z.infer<typeof signupBaseSchema>;

export const signupBaseSchema = z.object({
  name: userSchema.name,
  email: userSchema.email,
  password: userSchema.password,
});
