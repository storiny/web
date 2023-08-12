import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type RemoveAccountSchema = z.infer<typeof removeAccountSchema>;

export const removeAccountSchema = z.object({
  "current-password": userSchema.password
});
