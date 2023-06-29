import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type RecoverySchema = z.infer<typeof recoverySchema>;

export const recoverySchema = z.object({
  email: userSchema.email,
});
