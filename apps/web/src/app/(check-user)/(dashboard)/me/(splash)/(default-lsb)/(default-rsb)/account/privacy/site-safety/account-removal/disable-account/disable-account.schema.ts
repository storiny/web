import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type DisableAccountSchema = z.infer<typeof disableAccountSchema>;

export const disableAccountSchema = z.object({
  "current-password": userSchema.password
});
