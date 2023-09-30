import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type SignupUsernameSchema = z.infer<typeof SIGNUP_USERNAME_SCHEMA>;

export const SIGNUP_USERNAME_SCHEMA = z.object({
  username: USER_SCHEMA.username
});
