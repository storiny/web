import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;

export const deleteAccountSchema = z.object({
  "current-password": userSchema.password
});
