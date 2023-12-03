import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type MFASchema = z.infer<typeof MFA_SCHEMA>;

export const MFA_SCHEMA = z.object({
  mfa_code: z.string().min(6, ZOD_MESSAGES.min("authentication code", 6))
});
