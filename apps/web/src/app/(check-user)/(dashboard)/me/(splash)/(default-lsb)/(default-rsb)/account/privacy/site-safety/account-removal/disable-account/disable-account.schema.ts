import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type DisableAccountSchema = z.infer<typeof disableAccountSchema>;

export const disableAccountSchema = z.object({
  "current-password": USER_SCHEMA.password
});
