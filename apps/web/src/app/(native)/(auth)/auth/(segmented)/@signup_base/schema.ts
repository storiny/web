import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type SignupBaseSchema = z.infer<typeof SIGNUP_BASE_SCHEMA>;

export const SIGNUP_BASE_SCHEMA = z.object({
  name: USER_SCHEMA.name,
  email: USER_SCHEMA.email,
  password: USER_SCHEMA.password
});
