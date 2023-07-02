import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type ResetSchema = z.infer<typeof resetSchema>;

export const resetSchema = z.object({
  email: userSchema.email,
  password: userSchema.password,
  "logout-of-all-devices": z.boolean()
});
