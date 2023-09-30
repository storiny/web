import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type RecoverySchema = z.infer<typeof RECOVERY_SCHEMA>;

export const RECOVERY_SCHEMA = z.object({
  email: USER_SCHEMA.email
});
