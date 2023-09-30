import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type DisableAccountSchema = z.infer<typeof DISABLE_ACCOUNT_SCHEMA>;

export const DISABLE_ACCOUNT_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
