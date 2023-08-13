import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export const updatePasswordSchema = z.object({
  "current-password": userSchema.password,
  "new-password": userSchema.password
});
