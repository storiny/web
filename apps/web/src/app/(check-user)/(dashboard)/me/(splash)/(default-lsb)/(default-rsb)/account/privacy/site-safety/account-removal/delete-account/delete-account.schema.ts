import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type DeleteAccountSchema = z.infer<typeof DELETE_ACCOUNT_SCHEMA>;

export const DELETE_ACCOUNT_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
