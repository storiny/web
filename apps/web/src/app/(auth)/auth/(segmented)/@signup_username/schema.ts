import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type SignupUsernameSchema = z.infer<typeof signupUsernameSchema>;

export const signupUsernameSchema = z.object({
  username: USER_SCHEMA.username
});
