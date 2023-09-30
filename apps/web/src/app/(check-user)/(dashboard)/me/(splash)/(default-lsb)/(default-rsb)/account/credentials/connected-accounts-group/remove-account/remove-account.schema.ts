import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type RemoveAccountSchema = z.infer<typeof REMOVE_ACCOUNT_SCHEMA>;

export const REMOVE_ACCOUNT_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
