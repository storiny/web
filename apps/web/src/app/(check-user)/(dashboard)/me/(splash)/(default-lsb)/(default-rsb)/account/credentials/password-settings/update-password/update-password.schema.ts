import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export const updatePasswordSchema = z.object({
  "current-password": USER_SCHEMA.password,
  "new-password": USER_SCHEMA.password
});
