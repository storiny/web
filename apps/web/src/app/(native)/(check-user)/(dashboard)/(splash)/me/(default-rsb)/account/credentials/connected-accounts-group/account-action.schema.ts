import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type AccountActionSchema = z.infer<typeof ACCOUNT_ACTION_SCHEMA>;

export const ACCOUNT_ACTION_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
