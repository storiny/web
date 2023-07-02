import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type SignupUsernameSchema = z.infer<typeof signupUsernameSchema>;

export const signupUsernameSchema = z.object({
  username: userSchema.username
});
